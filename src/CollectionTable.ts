import create, { utils } from '@wonderlandlabs/collect';

import EventEmitter from "emitix";

import type {
  addDataMetaObj,
  contextObj, dataContextObj,
  keyProviderFn,
  mapCollection, queryCollection,
  queryDef,
  recordCreatorFn,
  tableObj,
  tableOptionsObj
} from './types';
import TableRecord from "./helpers/TableRecord";
import TableRecordJoin from "./helpers/TableRecordJoin";
import whereFn from "./helpers/whereFn";

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

export class CollectionTable extends EventEmitter implements tableObj, dataContextObj {
  public context: contextObj;

  name: string;

  protected recordCreator: recordCreatorFn | undefined;

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
      this.recordCreator = options?.recordCreator;
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
  public restore(store: Map<any, any>) {
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
          result.set(tableRecord.key, tableRecord.record);
        });
        return { result };
      }
    );
  }

  public hasKey(key) {
    return this.data.hasKey(key);
  }

  public recordForKey(key, meta) {
    return new TableRecord(this, key, meta);
  }

  /**
   * the "put" method. key can be explicit (in meta
   * @param data {any} ideally, a compound
   * @param meta {addDataMetaObj}
   *
   */
  public addData(data: any, meta?: addDataMetaObj) {
    const preparedData = this.newData(data, meta);

    // if meta doesn't contain key, generate an auto-key from the keyProvider.
    const key = this.makeDataKey(preparedData, meta);

    const previous = this.data.get(key);
    this.emit('addData:before', preparedData, key, previous);
    this.data.set(key, preparedData);
    this.emit('addData:after', preparedData, key, previous);
    return {
      key,
      record: preparedData,
      previous
    };
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

  public keyProvider: keyProviderFn = () => KeyProviders.Default(this);

  public getData(key: any) {
    return this.data.get(key);
  }

  protected newData(record: any, meta?: any) {
    let recordInstance = record;

    if (this.recordCreator) {
      recordInstance = this.recordCreator(this, record, meta);
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
      throw e('cannot make a table record without a key or keyProvider', {
        record: recordInstance, table: this, meta
      });
    }
    return key;
  }

  // -------------------------- query

  query(query: queryDef): queryCollection {
    if (query.table !== this.name) {
      throw e('badly targeted query; ', { query, table: this });
    }

    const joinHelpers = create(new Map());

    const records = ('key' in query) ? [this.recordForKey(query.key, {query, joinHelpers})] : this.data.keys()
      .map((key) => this.recordForKey(key, {query, joinHelpers}));

    if (query.where) {
      records.filter(whereFn(query));
    }

    query.joins?.forEach((qjd) => {
      const trJoin = new TableRecordJoin(qjd, this.context);
      joinHelpers.set(qjd, trJoin);
    });

    return records;
  }

  queryItems(query: queryDef): any[] {
    const result = this.query(query);
    return result? result.items.map(record => record.value) : [];
  }

  /*

export type joinConnObj = {
  table: string;
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
  table?: string;
  where?: string;
  as?: string;
  args? : any[];
}

 */
