import { create, utils, enums } from '@wonderlandlabs/collect';
import combinate from 'combinate';

import EventEmitter from 'emitix';

import type { collectionObj } from '@wonderlandlabs/collect';
import type {
  addDataMetaObj,
  anyMap,
  baseObj, changeObj,
  dataCreatorFn,
  keyProviderFn,
  mapCollection,
  queryDef,
  recordObj,
  tableObj,
  tableOptionsObj, tableRecordJoin, transactFn
} from './types';
import Record from './Record';
import { isCollection, isTableRecord } from './typeGuards';
import QueryFetchStream from './helpers/QueryFetchStream';
import QueryResultSet from './helpers/QueryResultSet';
import TableRecordJoin from './helpers/TableRecordJoin';
import { binaryOperator, booleanOperator } from './constants';

const { FormEnum } = enums;

const { e } = utils;

const KeyProviders = {
  _baseCache: new Map(),
  Default: (table: tableObj) => {
    const { base } = table;
    if (!KeyProviders._baseCache.has(base)) {
      KeyProviders._baseCache.set(base, 1);
    }
    const index = KeyProviders._baseCache.get(base);
    KeyProviders._baseCache.set(base, index + 1);
    return index;
  }
};

function arrayOfKeys (a) {
  if (!Array.isArray(a)) {
    return arrayOfKeys([a]);
  }
  return a.map((r) => {
    const ir = isTableRecord(r, true);
    return ir ? r.key : r;
  });
}

export class Table extends EventEmitter implements tableObj {
  constructor (
    base: baseObj,
    name: string,
    options?: tableOptionsObj
  ) {
    super();
    this.base = base;
    this.name = name;
    this._data = create(new Map([]));
    this.addOptions(options);
  }

  public base: baseObj;

  name: string;

  keyField?: any;

  protected dataCreator: dataCreatorFn | undefined;

  protected addOptions (options?: tableOptionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options?.keyProvider;
    }
    if (options && 'key' in options) {
      this.keyField = options.key;
      this.keyProvider = (item) => create(item).get(options.key);
    }
    if (options?.dataCreator) {
      this.dataCreator = options?.dataCreator;
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
  public restore (store: anyMap) {
    this._data.withComp(() => {
      this._data.change(store);
    }, { quiet: true });
    return this;
  }

  get data (): mapCollection {
    if (this.base.lastChange && !this.base.lastChange.backupTables.hasKey(this.name)) {
      this.base.lastChange.saveTableBackup(this.name, new Map(this._data.store));
    }
    return this._data;
  }

  set data (value: mapCollection) {
    this._data = value;
  }

  get size () {
    return this.data.size;
  }

  public addMany (data: Array<any | any[]>) {
    const result = new Map();
    return this.transact(
      () => {
        data.forEach((item) => {
          // @ts-ignore
          const tableRecord = Array.isArray(item) ? this.add(...item) : this.add(item);
          result.set(tableRecord.key, tableRecord.data);
        });
        return { result };
      }
    );
  }

  public hasKey (key) {
    return this.data.hasKey(key);
  }

  public recordForKey (key) {
    return new Record(this.base, this.name, key);
  }

  /**
   * the "put" method. key can be explicitly specified in `meta.key`
   * or derived from the keyField.
   *
   * This is an "upsert" type function - may replace existing.
   *
   * @param data {any} the value (or seed) for the item
   * @param meta {addDataMetaObj} any other values that the key/data factories need
   *
   */
  public add (data: any, meta?: addDataMetaObj): recordObj {
    const preparedData = this.createData(data, meta);

    // if meta doesn't contain key, generate an auto-key from the keyProvider.
    const key = this.makeDataKey(preparedData, meta);
    if (this.recordIsLocked(key)) {
      throw e('attempt to add record over locked record', {
        tableName: this.name, key, preparedData
      });
    }

    return this.set(key, preparedData);
  }

  public set (key, data): recordObj {
    if (this.recordIsLocked(key)) {
      throw e('cannot change record: locked by existing transaction',
        { tableName: this.name, key, action: 'set' });
    }

    return this.base.transact((_base: baseObj, change?: changeObj) => {
      const previous = this.data.get(key);
      if (change) {
        change.lockRecord(this.name, key, data, previous);
      }
      this.emit('set:before', this.name, key, data, previous);
      this.data.set(key, data);
      this.emit('set:after', this.name, key, data, previous);
      return this.recordForKey(key);
    });
  }

  // ----------------- Transact

  transact (action: transactFn, onError?: (err: any) => any) {
    try {
      const out = this.base.transact(action);
      if (out?.error) {
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

  public records (keys) {
    if (keys) {
      return keys.reduce((memo, key) => {
        if (this.hasKey(key)) {
          memo.push(this.recordForKey(key));
        }
        return memo;
      }, []);
    }
    return this.data.keys.map(key => this.recordForKey(key));
  }

  public queryEach (query, action) {
    this.transact(() => {
      const records = this.query(query);
      records.forEach(action);
    });
  }

  setField (key, field, value, change?) {
    if (!this.hasKey(key)) {
      throw e('cannot set the field: no record for key', {
        key, field, value
      });
    }
    if (this.recordIsLocked(key)) {
      throw e('attempt to set the field of a locked record', {
        key, field, value
      });
    }

    const data = this.getData(key);
    const c = create(data).cloneShallow();
    if (c.form === FormEnum.scalar) {
      throw e('attempt to set ');
    }
    if (typeof value === 'function') {
      c.set(field, value(c.store, this, this.base));
    } else {
      c.set(field, value);
    }

    if (change) {
      change.lockRecord(this.name, key);
      this.data.set(key, c.store);
    } else {
      this.transact((_base: baseObj, tChange: changeObj) => {
        tChange.lockRecord(this.name, key, c.store, data);
        this.data.set(key, c.store);
      });
    }
  }

  private _locks: Set<changeObj> = new Set();

  lock (change: changeObj) {
    this._locks.add(change);
  }

  unlock (change: changeObj) {
    this._locks.delete(change);
  }

  setManyFields (keys, field, value) {
    if (keys.find((key) => this.recordIsLocked(key))) {
      throw e('setManyFields: attempt to alter locked record', { keys, field, value });
    }
    this.transact(() => {
      let coll = keys;
      if (typeof keys === 'function') {
        this.data.cloneShallow.filter(keys).keys.forEach((iKey) => {
          this.setField(iKey, field, value);
        });
      } else {
        if (!isCollection(keys)) {
          coll = create(keys);
        }
        coll.forEach((key) => {
          this.recordForKey(key).setField(field, value);
        });
      }
    });
  }

  removeKey (key) {
    this.transact(() => {
      this.data.deleteKey(key);
    });
  }

  removeQuery (query) {
    this.transact(() => {
      const remQuery = {
        tableName: this.name,
        ...query
      };
      const toRemove = this.query(remQuery);
      const keys = toRemove.map((record) => record.key);
      const newData = this.data.cloneShallow().filter((_item, key) => !keys.includes(key));
      if (newData.size === this.size) {
        return;
      }
      this.updateData(newData, true);
    });
  }

  updateData (newData: collectionObj<any, any, any>, noTrans) {
    if (noTrans) {
      this._data = newData;
    } else {
      this.transact((_base, change) => {
        change.lockTable(this.name);
        this._data = newData;
      });
    }
  }

  removeItem (item) {
    if (!this.data.hasItem(item)) {
      return;
    }
    this.transact((_base, change) => {
      const key = this.data.keyOf(item);
      change.lockRecord(this.name, key, item);
      this.data.deleteItem(item);
    });
  }

  public keyProvider: keyProviderFn = () => KeyProviders.Default(this);

  public getData (key: any) {
    return this.data.get(key);
  }

  public createData (fromData?: any, meta?: any) {
    if (this.dataCreator) {
      return this.dataCreator(this, fromData, meta);
    }
    return fromData;
  }

  protected makeDataKey (recordInstance, meta) {
    const metaHasKey = meta && (typeof meta === 'object') && ('key' in meta);
    let key: any;

    if (metaHasKey) {
      key = meta?.key;
    } else if (this.keyProvider) {
      key = this.keyProvider(recordInstance, this, meta);
    } else {
      this.emit('error', {
        action: 'createData',
        input: [recordInstance, meta]
      });
      throw e('cannot make a tableName record without a key or keyProvider', {
        record: recordInstance, table: this, meta
      });
    }
    return key;
  }

  // -------------------------- query

  query (query: queryDef): recordObj[] {
    if (query.tableName && (query.tableName !== this.name)) {
      console.log('table.query: badly targeted query, wrong tablename; ', query, 'should be ', this.name);
      throw new Error(`table.query: badly targeted query, wrong tablename, not "${this.name}"; `);
    }

    const qrs = new QueryResultSet(this.base, query);
    return qrs.records;
  }

  stream (query: queryDef, listener) {
    return new QueryFetchStream(this.base, query).subscribe(listener);
  }

  /**
   * joins a set of records based on the join definition.
   * @param keys
   * @param joinName
   */
  join (keyMap: anyMap, joinName: string) {
    const query = {
      tableName: this.name,
      joins: [{
        joinName
      }]
    };
    const helper = new TableRecordJoin(this.base, query.joins[0], query);

    keyMap.forEach((foreignKeys, localKeys) => {
      if (!(foreignKeys && localKeys)) {
        return;
      }
      const combs = { foreignKeys: arrayOfKeys(foreignKeys), localKeys: arrayOfKeys(localKeys) };

      if (!((combs.foreignKeys.length > 0) && (combs.localKeys.length > 0))) {
        return;
      }
      this.transact((_base, change) => {
        combinate(combs).forEach(({ foreignKeys: foreignKey, localKeys: localKey }) => {
          this._joinKeyPair(localKey, foreignKey, helper, change);
        });
      });
    });
  }

  /**
   * update the fields in the records -- or create a join record
   * -- linking these two pieces of data
   *
   * @param localKey any
   * @param foreignKey any
   * @param helper
   * @protected
   */
  protected _joinKeyPair (localKey, foreignKey, helper: tableRecordJoin, change: changeObj) {
    const foreignTableName = helper.foreignConn?.tableName;
    const record = this.recordForKey(localKey);
    const { localConn, foreignConn, baseJoinDef } = helper;
    const joinTableName = baseJoinDef ? baseJoinDef.joinTableName : null;

    if (!(localConn &&
      foreignConn &&
      record.exists &&
      foreignTableName &&
      this.base.hasTable(foreignTableName))) {
      console.log('not joining lk:', localKey, 'fk:', foreignKey, 'ftn:', foreignTableName);
      console.log('conns:', localConn, foreignConn);
      console.log('record:', record);
      return;
    }

    const foreignRecord = this.base.table(foreignTableName).recordForKey(foreignKey);
    if (!(foreignRecord.exists)) {
      return;
    }

    if (joinTableName) {
      const localJoinField = localConn.joinTableField || localConn.tableName;
      const foreignJoinField = localConn.joinTableField || foreignConn.tableName;
      const joinTable = this.base.table(joinTableName);

      const existing = joinTable.query({
        tableName: joinTableName,
        where: {
          tests: [
            {
              field: localJoinField,
              test: binaryOperator.eq,
              against: localKey
            },
            {
              field: foreignJoinField,
              test: binaryOperator.eq,
              against: foreignKey
            }
          ],
          bool: booleanOperator.and
        }
      });

      if (!existing.length) {
        joinTable.add({
          [localJoinField]: localKey,
          [foreignJoinField]: foreignKey
        });
      }
      return;
    }

    if (localConn.key) {
      if (foreignConn.key) {
        throw new Error('you cannot have two foreign keys in the same join');
      } else {
        this.setField(localConn.key, foreignKey, change);
      }
    } else if (foreignConn.key) {
      foreignRecord.setField(foreignConn.key, localKey);
    } else {
      throw new Error('need a foreign key in one of the join terms OR a joinTableName for many-many joins');
    }
  }

  recordIsLocked (key: any): boolean {
    return this.base.recordIsLocked(this.name, key);
  }
}
