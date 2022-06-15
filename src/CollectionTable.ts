import create from '@wonderlandlabs/collect'

import EventEmitter from "emitix";
import type { contextObj, mapCollection, recordCreatorFn, tableObj, tableOptionsObj, keyProviderFn } from './types';

const KeyProviders = {
  _defaultIndex: 0,
  Default: () => {
    KeyProviders._defaultIndex += 1;
    return KeyProviders._defaultIndex;
  },
};

export class CollectionTable extends EventEmitter implements tableObj{
  constructor(
    context: contextObj,
    name: string,
    options?: tableOptionsObj
  ) {
    super();
    this.context = context;
    this.name = name;
    this._collection = create(new Map([]));
    this.addOptions(options);

  }

  protected addOptions(options?: tableOptionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options?.keyProvider;
    }
    if (options?.recordCreator ) {
      this.recordCreator = options?.recordCreator;
    }
    if (options?.data) {
      this.addMany(options?.data);
    }
  }

  get collection(): mapCollection {
    if (this.context.lastChange && !this.context.lastChange.backupTables.hasKey(this.name)) {
      this.context.lastChange.saveTableBackup(this.name, new Map(this._collection.store));
    }
    return this._collection;
  }

  set collection(value: mapCollection) {
    this._collection = value;
  }

  public restore(store: Map<any, any>) {
    this._collection.withComp({quiet: true}, () => {
      this._collection.change(store);
    });
    return this;
  }

  private _collection: mapCollection;

  protected recordCreator: recordCreatorFn | undefined;

  public context: contextObj;

  name: string;

  transact(action: (context: contextObj) => any, onError?: (err: any) => any) {
    try {
      this.context.transact(action);
    } catch (err) {
      if (onError) {
        return onError(err);
      }
        throw err;

    }
    return this;
  }

  public keyProvider: keyProviderFn = () => KeyProviders.Default();

  public addMany(data: Array<any | any[]>) {
    const result = new Map();
    return this.transact(
      () => {
        data.forEach((item) => {
          // @ts-ignore
          const tableRecord  = Array.isArray(item) ? this.addRecord(...item) : this.addRecord(item);
          result.set(tableRecord.key, tableRecord.record);
        });
        return { result };
      },
      err => ({
          error: err,
        })
    );
  }

  protected makeTableRecord(record: any, meta?: any) {
    let recordInstance = record;

    if (this.recordCreator) {
      recordInstance = this.recordCreator(this, record, meta);
    }
    return recordInstance;
  }

  protected makeRecordKey(recordInstance, meta) {

    const metaHasKey = meta && (typeof meta === 'object') && ('key' in meta);
    let key: any;

    if (metaHasKey) {
      key = meta?.key;
    } else if (this.keyProvider) {
      key = this.keyProvider(this, recordInstance, meta);
    } else {
      this.emit('error', {
        action: 'makeTableRecord',
        input: [recordInstance, meta]
      })
      throw new Error('cannot make a table record without a key or keyProvider');
    }
    return key;
  }

  public hasRecord(key) {
    return this.collection.hasKey(key);
  }

  public addRecord(record: any, meta?: any) {
    const recordInstance = this.makeTableRecord(record, meta);

    const key = this.makeRecordKey(recordInstance, meta);

    const previous = this.collection.get(key);
    this.emit('addRecord:before', recordInstance, key, previous);
    this.collection.set(key, recordInstance);
    this.emit('addRecord:after', recordInstance, key, previous);
    return {
      key,
      record: recordInstance,
      previous
    };
  }

  public getRecord(key: any) {
    return this.collection.get(key);
  }
}
