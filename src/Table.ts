import create, { utils } from '@wonderlandlabs/collect';

import EventEmitter from "emitix";

import type {
  addDataMetaObj, anyMap,
  contextObj,
  keyProviderFn,
  mapCollection,
  queryDef,
  dataCreatorFn,
  tableObj,
  tableOptionsObj, recordObj
} from './types';
import Record from "./Record";
import { isCollection } from "./typeGuards";
import QueryFetchStream from "./QueryFetchStream";
import QueryResultSet from "./QueryResultSet";

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

export class Table extends EventEmitter implements tableObj {
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
    return new Record(this.context, this.name, key);
  }

  /**
   * the "put" method. key can be explicit
   * @param data {any} the value (or seed) for the item
   * @param meta {addDataMetaObj} any other values that the key/data factories need
   *
   */
  public addData(data: any, meta?: addDataMetaObj): recordObj {
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
      const records = this.query(query);
      records.forEach(action);
    });
  }

  set(key, field, value) {
    this.recordForKey(key).setField(field, value);
  }

  setMany(keys, field, value) {
    this.transact(() => {
      let coll = keys;
      if (typeof keys === "function") {
        this.data.cloneShallow.filter(keys).forEach((_i, iKey) => {
          this.recordForKey(iKey).setField(field, value);
        });

      } else {
        if (!isCollection(keys)) {
          coll = create(keys);
        }
        coll.forEach((key) => {
          this.recordForKey(key).setField(field, value);
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

  query(query: queryDef): recordObj[] {
    if (query.tableName !== this.name) {
      throw e('badly targeted query; ', { query, table: this });
    }

    const qrs = new QueryResultSet(this.context, query);
    return qrs.records;
  }

  stream(query: queryDef, listener) {
    return new QueryFetchStream(this.context, query).subscribe(listener);
  }
}
