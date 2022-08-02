import {
  baseObj,
  joinConnObj,
  queryDef,
  queryJoinDef,
  recordObj,
  recordSetCollection,
  tableRecordJoin
} from '../types';
import { joinForm } from '../constants';
import asCollection from './asCollection';

function isPlural (conn: joinConnObj) {
  if (!conn.key) {
    return false;
  }
  return true;
}

/**
 * parses the individual join of a query; a helper class
 */
export class TableRecordJoin implements tableRecordJoin {
  private query: queryDef;

  constructor (base, joinDef: queryJoinDef, query: queryDef) {
    this.joinDef = joinDef;
    this.query = query;
    this.base = base;

    if (this.joinName) {
      this._fromBase();
    }
    if (this.joinDef.connections) {
      this._fromLocal();
    }
  }

  joinDef: queryJoinDef;

  localConn?: joinConnObj;

  foreignConn?: joinConnObj;

  private base: baseObj;

  //  ----------------- derived fields

  get joinTable () {
    return this.baseJoinDef.joinTableName ? this.base.table(this.baseJoinDef.joinTableName) : null;
  }

  get joinTableFromKey () {
    return this.localConn?.joinTableField || this.localConn?.tableName;
  }

  get joinTableToKey () {
    return this.foreignConn?.joinTableField || this.foreignConn?.tableName;
  }

  get foreignTable () {
    return this.foreignConn ? this.base.table(this.foreignConn.tableName) : null;
  }

  get foreignKey () {
    return this.foreignConn?.key;
  }

  get foreignConnKeyIsForeign () {
    return this.foreignKey && this.foreignTable?.keyField !== this.foreignKey;
  }

  get localTable () {
    return this.localConn ? this.base.table(this.localConn.tableName) : null;
  }

  get localKey () {
    return this.localConn?.key;
  }

  get localConnKeyIsForeign () {
    return this.localKey && this.localTable?.keyField !== this.localKey;
  }

  get joinForm () {
    let out = joinForm.badJoin;
    if (!(this.localConn && this.foreignConn)) {
      out = joinForm.badJoin;
    } else if (this.baseJoinDef.joinTableName) {
      out = joinForm.manyToMany;
    } else if (this.localConnKeyIsForeign && this.foreignConnKeyIsForeign) {
      out = joinForm.foreignToForeignKey;
    } else if (this.localConnKeyIsForeign) {
      out = joinForm.fromForeignKey;
    } else if (this.foreignConnKeyIsForeign) {
      out = joinForm.toForeignKey;
    } else {
      out = joinForm.keyToKey;
    }

    return out;
  }

  getJoinedRecords (fromRecords: recordSetCollection) {
    let records: (recordObj | undefined)[][] = [];
    switch (this.joinForm) {
      case joinForm.manyToMany:
        records = this.manyToManyRecords(fromRecords);
        break;

      case joinForm.fromForeignKey:
        records = this.fromForeignRecords(fromRecords);
        break;

      case joinForm.toForeignKey:
        records = this.toForeignRecords(fromRecords);
        break;

      case joinForm.badJoin:
        break;
      default:
        records = [this.localTable?.records() || [], this.foreignTable?.records() || []];
    }
    return records;
  }

  get tableName () {
    return this.query.tableName;
  }

  get foreignIsPlural () {
    return this.foreignConn ? isPlural(this.foreignConn) : false;
  };

  get localIsPlural () {
    return this.localConn ? isPlural(this.localConn) : false;
  }

  get joinName () {
    return this.joinDef.joinName;
  }

  get attachKey () {
    if (this.joinDef.as) {
      return this.joinDef.as;
    }
    if (this.joinDef.joinName) {
      return this.joinDef.joinName;
    }
    return '';
  }

  // ----------------- parsers

  /**
   * parses a transiently defined join
   */
  _fromLocal () {
    if (!this.joinDef.connections) {
      throw new Error('_fromLocal requires connections');
    }

    const [fromDef, toDef] = this.joinDef.connections;
    if (fromDef.tableName === this.tableName) {
      this.localConn = fromDef;
      this.foreignConn = toDef;
    } else if (toDef.tableName === this.tableName) {
      this.foreignConn = fromDef;
      this.localConn = toDef;
    }
  }

  get baseJoinDef () {
    if (!this.base.joins.hasKey(this.joinName)) {
      return this.joinDef;
    }
    return this.base.joins.get(this.joinName);
  }

  _fromBase () {
    const def = this.baseJoinDef;
    if (!def) {
      throw new Error('cannot find baseJoinDef');
    }
    if (def?.from?.tableName === this.tableName) {
      this.localConn = def.from;
      this.foreignConn = def.to;
    } else if (def?.to?.tableName === this.tableName) {
      this.localConn = def.to;
      this.foreignConn = def.from;
    } else {
      console.warn('_fromBase: cannot find tableName', this.tableName, 'in joinDef', def);
    }
  }

  private manyToManyRecords (fromRecords: recordSetCollection) {
    const localKeySet = new Set();
    const foreignKeySet = new Set();

    // @TODO: only filter if fromKeyMap size < fromTable.size
    const fromKeyMap = fromRecords.keys.reduce((map, key) => {
      map.set(key, key);
      return map;
    }, new Map());

    const jtFromKey = this.joinTableFromKey;
    const jtToKey = this.joinTableToKey;
    const joinKeys: any[] = [];

    this.joinTable?.data.forEach((joinPair) => {
      const conn = asCollection(joinPair);
      const fromKey = conn.get(jtFromKey);
      const toKey = conn.get(jtToKey);
      if (!fromKeyMap.has(fromKey)) {
        return;
      }
      localKeySet.add(fromKey);
      foreignKeySet.add(toKey);
      joinKeys.push([fromKey, toKey]);
    });

    return [
      fromRecords.items.filter((record) => {
        return localKeySet.has(record.key);
      }),
      this.foreignTable?.records(Array.from(foreignKeySet.values())) || [],
      joinKeys
    ];
  }

  private fromForeignRecords (fromRecords: recordSetCollection) {
    const [localKeySet, foreignKeySet] = fromRecords.items
      .reduce((memo, record) => {
        const coll = record.collection;
        if (coll.hasKey(this.localKey)) {
          memo[0].add(record.key);
          memo[1].add(coll.get(this.localKey));
        }
        return memo;
      }, [new Set(), new Set()]);

    return [
      fromRecords.items.filter((record) => {
        return localKeySet.has(record.key);
      }),
      this.foreignTable?.records(Array.from(foreignKeySet.values())) || []
    ];
  }

  private toForeignRecords (fromRecords: recordSetCollection) {
    const [localKeySet, foreignKeySet] = this.foreignTable?.data
      .reduce((memo, foreignData, foreignKey) => {
        const foreignColl = asCollection(foreignData);
        if (foreignColl.hasKey(this.foreignKey)) {
          const localKey = foreignColl.get(this.foreignKey);
          if (fromRecords.hasKey(localKey)) {
            memo[0].add(localKey);
            memo[1].add(foreignKey);
          }
        }
        return memo;
      }, [new Set(), new Set()]);

    return [
      Array.from(localKeySet.values()).map((key) => fromRecords.get(key)),
      this.foreignTable?.records(Array.from(foreignKeySet.values())) || []
    ];
  }
}

export default TableRecordJoin;
