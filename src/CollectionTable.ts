import create, { utils } from '@wonderlandlabs/collect';

import EventEmitter from "emitix";

import type {
  contextObj,
  joinConnObj,
  joinDefObj,
  keyProviderFn,
  mapCollection,
  queryDef,
  queryJoinDef,
  recordCreatorFn,
  tableObj,
  tableOptionsObj
} from './types';
import { joinFreq } from "./constants";

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

  private _data: mapCollection;

  get data(): mapCollection {
    if (this.context.lastChange && !this.context.lastChange.backupTables.hasKey(this.name)) {
      this.context.lastChange.saveTableBackup(this.name, new Map(this._data.store));
    }
    return this._data;
  }

  set data(value: mapCollection) {
    this._data = value;
  }

  public restore(store: Map<any, any>) {
    this._data.withComp({ quiet: true }, () => {
      this._data.change(store);
    });
    return this;
  }

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

  public addMany(data: Array<any | any[]>) {
    const result = new Map();
    return this.transact(
      () => {
        data.forEach((item) => {
          // @ts-ignore
          const tableRecord = Array.isArray(item) ? this.addRecord(...item) : this.addRecord(item);
          result.set(tableRecord.key, tableRecord.record);
        });
        return { result };
      }
    );
  }

  public hasRecord(key) {
    return this.data.hasKey(key);
  }

  public addRecord(record: any, meta?: any) {
    const recordInstance = this.makeTableRecord(record, meta);

    const key = this.makeRecordKey(recordInstance, meta);

    const previous = this.data.get(key);
    this.emit('addRecord:before', recordInstance, key, previous);
    this.data.set(key, recordInstance);
    this.emit('addRecord:after', recordInstance, key, previous);
    return {
      key,
      record: recordInstance,
      previous
    };
  }

  public getRecord(key: any) {
    return this.data.get(key);
  }

  protected addOptions(options?: tableOptionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options?.keyProvider;
    }
    if (options?.recordCreator) {
      this.recordCreator = options?.recordCreator;
    }
    if (options?.data) {
      this.addMany(options?.data);
    }
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

  // -------------------------- query

  query(query: queryDef) {
    if (query.table !== this.name) {
      throw e('badly targeted query; ', { query, table: this });
    }

    let records;

    if (query.where) {
      records = this.data.cloneShallow()
        .filter((item, key) => query.where && query.where(item, key, this))
        .clone();
    } else {
      records = this.data.clone();
    }

    if (query.joins) {
      records = records.map((item, key) => {
        const target = create(item);
        query.joins?.forEach((joinItem, _key, _map) => {
          const ji = joinItem as queryJoinDef;

          const joined = this._joinItem(key, item, ji);
          if (joined !== undefined) {
            if (ji.as) {
              target.set(ji.as, joined);
            } else if (ji.joinName) {
              target.set(ji.joinName, joined);
            }
          }
        });
        return item;
      });
    }

    return records.items;
  }

  /*

export type joinConnObj = {
  table: string;
  key?: string;
  joinTableKey?: string;
  frequency?: joinFreq;
};

   */

  protected _joinItemTo(key, item, joinFrom, joinOther: joinConnObj) {
    let sourceKey = key;
    if (joinFrom.key) {
      sourceKey = joinFrom.key;
    }

    const targetValue = create(item).get(sourceKey);

    if (!this.context.hasTable(joinOther.table)) {
      throw e('_joinItemTo: other table is not present', { joinOther, table: this })
    }

    const matchFn = (otherItem, otherKey) => {
      if (joinOther.key) {
        if (create(otherItem).get(joinOther.key) === targetValue) {
          return true;
        }
      } else if (otherKey === targetValue) {
        return true;
      }
      return false;
    }

    const otherTable = this.context.table(joinOther.table);
    let out;
    switch (joinOther.frequency) {
      case joinFreq.noneOrOne:
      case joinFreq.one:
        out = otherTable.data.reduce((memo, otherItem, otherKey, _s, stopper) => {
          if (matchFn(otherItem, otherKey)) {
            stopper.final();
            return otherItem;
          }
          return memo;
        });

        break;

      case joinFreq.oneOrMore:
      case joinFreq.noneOrMore:
        out = otherTable.data.cloneShallow().filter(matchFn);
        break;

      default:
    }
    return out;
  }

  protected _joinItem(key, item, join: queryJoinDef) {
    if (join.joinName) {
      if (!this.context.joins.hasKey(join.joinName)) {
        throw e('join - bad join name', { item, join, table: this });
      }
      const def: joinDefObj = this.context.joins.get(join.joinName);
      if (def.from.table === this.name) {
        return this._joinItemTo(key, item, def.from, def.to);
      }
      if (def.to.table === this.name) {
        return this._joinItemTo(key, item, def.to, def.from);
      }
      throw e('bad join def obj:', { item, join, table: this });
    }
    if (join.join) {
      return join.join(item, this, join.args);
    }
    throw e('join needs a named join or a join fn', { item, join })
  }
}

/*


export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};



export type queryJoinDef = {
  joinName?: string;
  table?: string;
  where?: string;
  joins?: queryDef[];
}
 */
