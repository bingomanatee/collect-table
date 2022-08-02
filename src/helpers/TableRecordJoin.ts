import {
  baseObj,
  joinConnObj,
  queryDef,
  queryJoinDef,
  recordSetCollection,
  tableRecordJoin
} from '../types';
import { create } from '@wonderlandlabs/collect';

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
    let foreignRecords: recordSetCollection;
    switch (this.joinForm) {
      case joinForm.manyToMany:
        foreignRecords = this.manyToManyRecords(fromRecords);
        break;

      case joinForm.fromForeignKey:
        foreignRecords = this.fromForeignRecords(fromRecords);
        break;

      case joinForm.toForeignKey:
        foreignRecords = this.toForeignRecords(fromRecords);
        break;

      case joinForm.badJoin:
        break;

      default:
        throw new Error('get joined records cannot handle joinForm ' + this.joinForm);
    }
    return foreignRecords;
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
    const foreignRecords = create(new Map());
    const { joinTableFromKey, joinTableToKey, foreignTable, joinTable, attachKey } = this;

    if (!(foreignTable && joinTable)) {
      return foreignRecords;
    }

    joinTable.data.forEach((data, key) => {
      const coll = create(data);
      const localKey = coll.get(joinTableFromKey);
      const foreignKey = coll.get(joinTableToKey);
      if (localKey === undefined || foreignKey === undefined) {
        return;
      }
      const localRecord = fromRecords.get(localKey);
      if (!(localRecord && foreignTable)) {
        return;
      }

      let foreignRecord;
      if (foreignRecords.hasKey(foreignKey)) {
        foreignRecord = foreignRecords.get(foreignRecord);
      } else {
        foreignRecord = foreignTable.recordForKey(foreignKey);
        foreignRecords.set(key, foreignRecord);
      }
      if (foreignRecord) {
        localRecord.addJoin(attachKey, [foreignRecord]);
      }
    });

    return foreignRecords;
  }

  private fromForeignRecords (fromRecords: recordSetCollection
  ) {
    const foreignRecords = create(new Map());
    const { attachKey, localKey, foreignTable } = this;
    if (!foreignTable || !localKey) {
      return foreignRecords.items;
    }

    fromRecords.forEach((record) => {
      if (!record.collection.hasKey(localKey)) {
        return;
      }
      const foreignKey = record.collection.get(localKey);
      let foreignRecord;
      if (foreignRecords.hasKey(foreignKey)) {
        foreignRecord = foreignRecords.get(foreignKey);
      } else {
        foreignRecord = foreignTable.recordForKey(foreignKey);
        foreignRecords.set(foreignKey, foreignRecord);
      }
      record.addJoin(attachKey, foreignRecord);
    });

    return foreignRecords;
  }

  private toForeignRecords (fromRecords: recordSetCollection) {
    const foreignRecords = create(new Map());
    const { attachKey, foreignKey, foreignTable } = this;
    if (!foreignTable || !foreignKey) {
      return foreignRecords.items;
    }

    foreignTable.data.forEach((data, key) => {
      const coll = asCollection(data);
      if (coll.hasKey(foreignKey)) {
        const localKey = coll.get(foreignKey);
        if (fromRecords.hasKey(localKey)) {
          const localRecord = fromRecords.get(localKey);
          let foreignRecord;
          if (foreignRecords.hasKey(key)) {
            foreignRecord = foreignRecords.getKey(key);
          } else {
            foreignRecord = foreignTable?.recordForKey(key);
            foreignRecords.set(key, foreignRecord);
          }
          localRecord.addJoin(attachKey, [foreignRecord]);
        }
      }
    });

    return foreignRecords;
  }
}

export default TableRecordJoin;
