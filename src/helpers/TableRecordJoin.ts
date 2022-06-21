import {create} from '@wonderlandlabs/collect';
import { contextObj, joinConnObj, joinDefObj, joinResult, queryJoinDef, tableObj, tableRecordObj } from "../types";
import {joinFreq} from "../constants";

/**
 * this class exists to support the updateJoinedRecord method below; it takes in a joinquery def and
 */
 export class TableRecordJoin {

  constructor(context, joinDef: queryJoinDef) {
    this.joinDef = joinDef;
    this.context = context;
  }

  private joinDef: queryJoinDef;

  private context: contextObj;

  updateJoinedRecord(record: tableRecordObj) {
    const records = this.joinedRecords(record);
    record.joinedRecords.set(this.attachKey, records);
  }

  _joinedRecordsFromContext(record): joinResult {
    if (!this.context.joins.hasKey(this.joinName)) {
      console.error('cannot find ', this.joinName, 'in', this.context.joins.store);
      throw new Error(`TableRecordJoin._performContextJoin join - bad join name ${  this.joinName}`);
    }
    const def: joinDefObj = this.context.joins.get(this.joinName);
// @TODO: cache
    if (def?.from?.table === record.tableName) {
      this._localConn = def.from;
      this._foreignConn = def.to;
    } else if (def?.to?.table === record.tableName) {
      this._localConn = def.to;
      this._foreignConn = def.from;
    } else {
      return undefined;
    }
    return this._foreignRecords(record);
  }

  protected get onlyOneResult () {
    if (this._foreignConn === undefined) return false;
    return (this._foreignConn.frequency === joinFreq.noneOrOne) || (this._foreignConn.frequency === joinFreq.one);
  }

  protected _foreignRecords(record: tableRecordObj): joinResult {
    let foreignKey = record.key;
    if (!(this._foreignConn && this._localConn)) {
      throw new Error('_joinedItemTo must have defined conns');
    }
    if (this._localConn.key) {
      foreignKey = create(record.data).get(this._localConn.key);
    }

    if (!this.context.hasTable(this._foreignConn.table)) {
      throw new Error('_foreignRecords: other table is not present')
    }

    const matchFn = (otherItem, otherKey) => {
      let out = false;

      if (!(this._foreignConn)) {
        throw new Error('_joinedItemTo must have defined _foreignConn');
      }

      if (this._foreignConn.key) {
        if (create(otherItem).get(this._foreignConn.key) === foreignKey) {
          out = true;
        }
      } else if (otherKey === foreignKey) {
        out = true;
      }

      // @TODO: find out why using stopper fails here.
      return out;
    }

    const foreignTable : tableObj  = this.context.table(this._foreignConn.table);
    const meta = this.joinDef.joins? {joins: this.joinDef.joins} : {};

    let found = foreignTable.data.cloneShallow()
      .filter(matchFn)
      .map((_data, otherKey)=> foreignTable.recordForKey(otherKey, meta))

    if (this.onlyOneResult) {
      found = found.firstItem;
    } else {
      found = found.items;
    }

    return found;
  }

  /**
   * @protected
   */
  protected get joinName() {
    return this.joinDef.joinName;
  }

  protected get attachKey() {
    if (this.joinDef.as) {
      return this.joinDef.as;
    }
    if (this.joinDef.joinName) {
      return this.joinDef.joinName;
    }
    return '';
  }

  _localConn?: joinConnObj;

  _foreignConn?: joinConnObj;

  _recordsFromLocalJoin(record): joinResult {
    if (!this.joinDef.connections) throw new Error('_recordsFromLocalJoin requires connections');

    const [fromDef, toDef] = this.joinDef.connections;
    if (fromDef.table === record.tableName) {
      this._localConn = fromDef;
      this._foreignConn = toDef;
    } else if (toDef.table === record.tableName) {
      this._foreignConn = fromDef;
      this._localConn = toDef;
    } else {
      return undefined;
    }

// @TODO: cache
    return this._foreignRecords(record);
  }

  protected joinedRecords(record: tableRecordObj): joinResult {
    const {key, data} = record;
    if (key === 'undefined' || data  === 'undefined') {
      return undefined;
    }

    if (this.joinName) {
      return this._joinedRecordsFromContext(record);
    }
    if (this.joinDef.connections) {
      return this._recordsFromLocalJoin(record);
    }
    return undefined;
  }
}

export default TableRecordJoin;
