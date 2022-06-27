import create, { utils } from '@wonderlandlabs/collect';

import EventEmitter from "emitix";

import type {
  addDataMetaObj, anyMap,
  contextObj, dataSetObj,
  keyProviderFn,
  mapCollection,
  queryDef,
  dataCreatorFn,
  tableObj,
  tableOptionsObj, tableRecordObj
} from './types';
import TableRecord from "./helpers/TableRecord";
import DataSet from "./DataSet";
import whereFn from "./helpers/whereFn";
import dataSetJoinReducer from "./helpers/dataSetJoinReducer";
import { isCollection } from "./typeGuards";

const { e } = utils;

const KeyProviders = {
  _contextCache: new Map(),
  Default: (table: tableObj) => {
    const { context } = table;
    if (!KeyProviders._contextCache.has(context)) {
      KeyProviders._contextCache.set(context, 1);
    }
    const index = KeyProviders._contextCache.get(context);
    KeyProviders._contextCache.set(context, index + 1);
    return index;
  },
};

export class CollectionTable extends EventEmitter implements tableObj {
  public context: contextObj;

  name: string;

  protected dataCreator: dataCreatorFn | undefined;

  constructor(
    context: contextObj,
    name: string,
    options?: tableOptionsObj
  ) {
    super();
    this.context = context;
    this.name = name;
    this._data = create(new Map([]));
    this.addOptions(options);

  }

  protected addOptions(options?: tableOptionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options?.keyProvider;
    }
    if (options && 'key' in options) {
      this.keyProvider = (item) => create(item).get(options.key);
    }
    if (options?.recordCreator) {
      this.dataCreator = options?.recordCreator;
    }
    if (options?.data) {
      this.addMany(options?.data);
    }
  }

  // -------------- Data

  private _data: mapCollection;

  /**
   * redact data state to a transactional snapshot
   * @param store
   */
  public restore(store: anyMap) {
    this._data.withComp({ quiet: true }, () => {
      this._data.change(store);
    });
    return this;
  }

  get data(): mapCollection {
    if (this.context.lastChange && !this.context.lastChange.backupTables.hasKey(this.name)) {
      this.context.lastChange.saveTableBackup(this.name, new Map(this._data.store));
    }
    return this._data;
  }

  set data(value: mapCollection) {
    this._data = value;
  }

  public addMany(data: Array<any | any[]>) {
    const result = new Map();
    return this.transact(
      () => {
        data.forEach((item) => {
          // @ts-ignore
          const tableRecord = Array.isArray(item) ? this.addData(...item) : this.addData(item);
          result.set(tableRecord.key, tableRecord.data);
        });
        return { result };
      }
    );
  }

  public hasKey(key) {
    return this.data.hasKey(key);
  }

  public recordForKey(key) {
    return new TableRecord(this.context, this.name, key);
  }

  /**
   * the "put" method. key can be explicit
   * @param data {any} the value (or seed) for the item
   * @param meta {addDataMetaObj} any other values that the key/data factories need
   *
   */
  public addData(data: any, meta?: addDataMetaObj): tableRecordObj {
    const preparedData = this.newData(data, meta);

    // if meta doesn't contain key, generate an auto-key from the keyProvider.
    const key = this.makeDataKey(preparedData, meta);

    const previous = this.data.get(key);
    this.emit('addData:before', preparedData, key, previous);
    this.data.set(key, preparedData);
    this.emit('addData:after', preparedData, key, previous);
    return this.recordForKey(key);
  }

  // ----------------- Transact

  transact(action: (context: contextObj) => any, onError?: (err: any) => any) {
    try {
      const out = this.context.transact(action);
      if (out.error) {
        throw out.error;
      }
      return out;
    } catch (err) {
      if (onError) {
        return onError(err);
      }
      throw err;
    }
  }

  public queryEach(query, action) {
    this.transact(() => {
      const dataSet = this.query(query);

      dataSet.value.forEach((item, key) =>{
        if (item instanceof TableRecord) {
          action(item, this.context, this);
        } else {
          action(this.recordForKey(key), this.context, this);
        }
      })
    });
  }

  set(key, field, value) {
    this.recordForKey(key).set(field, value);
  }

  setMany(keys, field, value) {
    this.transact(() => {
      let coll = keys;
      if (typeof keys === "function") {
        this.data.cloneShallow.filter(keys).forEach((_i, iKey) => {
          this.recordForKey(iKey).set(field, value);
        });

      } else {
        if (!isCollection(keys)) {
          coll = create(keys);
        }
        coll.forEach((key) => {
          this.recordForKey(key).set(field, value);
        });
      }
    })
  }

  remove(key) {
    if (typeof key === 'function') {
      this.data.filter((_i, iKey) => !key(this.recordForKey(iKey)))
    }
    this.data.deleteKey(key);
  }

  removeItem(item) {
    this.data.deleteItem(item);
  }

  public keyProvider: keyProviderFn = () => KeyProviders.Default(this);

  public getData(key: any) {
    return this.data.get(key);
  }

  protected newData(record: any, meta?: any) {
    let recordInstance = record;

    if (this.dataCreator) {
      recordInstance = this.dataCreator(this, record, meta);
    }
    return recordInstance;
  }

  protected makeDataKey(recordInstance, meta) {

    const metaHasKey = meta && (typeof meta === 'object') && ('key' in meta);
    let key: any;

    if (metaHasKey) {
      key = meta?.key;
    } else if (this.keyProvider) {
      key = this.keyProvider(recordInstance, this, meta);
    } else {
      this.emit('error', {
        action: 'newData',
        input: [recordInstance, meta]
      })
      throw e('cannot make a tableName record without a key or keyProvider', {
        record: recordInstance, table: this, meta
      });
    }
    return key;
  }

  // -------------------------- query

  query(query: queryDef): dataSetObj {
    if (query.tableName !== this.name) {
      throw e('badly targeted query; ', { query, table: this });
    }

    let querySelector;
    if (query.where) {
      const whereTest = whereFn(query);
      querySelector = (keys) => keys.filter((oKey) => {
        const record = this.recordForKey(oKey);
        const out = whereTest(record);
        return out;
      })
    }

    return new DataSet({
      sourceTable: this.name,
      selector: querySelector,
      context: this.context,
      reducer: query.joins? dataSetJoinReducer(query) : undefined
    });
  }

  /*

export type joinConnObj = {
  tableName: string;
  key?: string;
  joinTableKey?: string;
  frequency?: joinFreq;
};

   */
}

/*


export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};

export type queryJoinDef = {
  joinName?: string;
  join: joinFn;
  tableName?: string;
  where?: string;
  as?: string;
  args? : any[];
}

 */
