import create, { utils } from '@wonderlandlabs/collect';
import combinate from 'combinate';

import EventEmitter from "emitix";

import type { collectionObj } from "@wonderlandlabs/collect/types/types";
import type {
  addDataMetaObj,
  anyMap,
  baseObj,
  dataCreatorFn,
  keyProviderFn,
  mapCollection,
  queryDef,
  recordObj,
  tableObj,
  tableOptionsObj, tableRecordJoin
} from './types';
import Record from "./Record";
import { isCollection, isTableRecord } from "./typeGuards";
import QueryFetchStream from "./helpers/QueryFetchStream";
import QueryResultSet from "./helpers/QueryResultSet";
import TableRecordJoin from "./helpers/TableRecordJoin";
import { binaryOperator, booleanOperator } from "./constants";

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
  },
};

export class Table extends EventEmitter implements tableObj {
  public base: baseObj;

  name: string;

  protected dataCreator: dataCreatorFn | undefined;

  constructor(
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
    if (this.base.lastChange && !this.base.lastChange.backupTables.hasKey(this.name)) {
      this.base.lastChange.saveTableBackup(this.name, new Map(this._data.store));
    }
    return this._data;
  }

  set data(value: mapCollection) {
    this._data = value;
  }

  get size() {
    return this.data.size;
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
    return new Record(this.base, this.name, key);
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

  transact(action: (base: baseObj) => any, onError?: (err: any) => any) {
    try {
      const out = this.base.transact(action);
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

  removeKey(key) {
    this.transact(() => {
      this.data.deleteKey(key);
    })
  }

  removeQuery(query) {
    this.transact(() => {

      const remQuery = {
        tableName: this.name,
        ...query
      }
      const toRemove = this.query(remQuery);
      const keys = toRemove.map((record) => record.key);
      const newData = this.data.cloneShallow().filter((_item, key) => !keys.includes(key));
      if (newData.size === this.size) {
        return;
      }
      this.updateData(newData, true);
    });
  }

  updateData(newData: collectionObj<any, any, any>, noTrans) {
    if (noTrans) {
      this._data = newData;
    } else {
      this.transact(() => {
        this.updateData(newData, true);
      })
    }
  }

  removeItem(item) {
    this.transact(() => {
      this.data.deleteItem(item);
    });
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
    if (query.tableName !== this.name)
    {
      console.log('table.query: badly targeted query, wrong tablename; ',query, 'should be ', this.name);
      throw new Error(`table.query: badly targeted query, wrong tablename, not "${this.name}"; `);
    }

    const qrs = new QueryResultSet(this.base, query);
    return qrs.records;
  }

  stream(query: queryDef, listener) {
    return new QueryFetchStream(this.base, query).subscribe(listener);
  }

  /**
   * joins a set of records based on the join definition.
   * @param keys
   * @param joinName
   */
  join(keyMap: anyMap, joinName: string) {
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
      const combs = { foreignKeys: arrayOfKeys(foreignKeys), localKeys: arrayOfKeys(localKeys) }
      console.log('combs: ', combs);
      if (!((combs.foreignKeys.length > 0) && (combs.localKeys.length > 0))) {
        return;
      }
      combinate(combs).forEach(({ foreignKeys: foreignKey, localKeys: localKey }) => {
        this._joinKeyPair(localKey, foreignKey, helper);
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
  protected _joinKeyPair(localKey, foreignKey, helper: tableRecordJoin) {
    const foreignTableName = helper.foreignConn?.tableName;
    const record = this.recordForKey(localKey);
    const { localConn, foreignConn, baseJoinDef } = helper;
    const joinTableName = baseJoinDef ? baseJoinDef.joinTableName : null;

    if (!(localConn &&
      foreignConn &&
      record.exists && foreignTableName && this.base.hasTable(foreignTableName))) {
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
              test: binaryOperator.eq, against: foreignKey
            }
          ],
          bool: booleanOperator.and,
        }
      });
      console.log('existing:', existing);
      if (!existing.length){
        console.log('adding', {
            [localJoinField]: localKey,
            [foreignJoinField]: foreignKey
          }, 'to', joinTable.name
        );
        joinTable.addData({
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
        record.setField(localConn.key, foreignKey);
      }
    } else if (foreignConn.key) {
      foreignRecord.setField(foreignConn.key, localKey);
    } else {
      console.log('m2m??? baseJoinDef: ', baseJoinDef);
      throw new Error('many-to-many not implemented');
    }

  }
}

function arrayOfKeys(a) {
  if (!Array.isArray(a)) {
    return arrayOfKeys([a]);
  }
  return a.map((r) => {
    const ir = isTableRecord(r);
    return ir ? r.key : r
  });
}
