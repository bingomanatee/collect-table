import {create} from '@wonderlandlabs/collect';
import { contextObj, joinConnObj, joinDefObj, joinResult, queryJoinDef, tableObj, tableRecordObj } from "../types";
import {joinFreq} from "../constants";
import TableRecord from "./TableRecord";

export default class TableRecordJoin {

  constructor(joinDef: queryJoinDef, context) {
    this.joinDef = joinDef;
    this.context = context;
  }

  private joinDef: queryJoinDef;

  private context: contextObj;

  injectJoin(record: tableRecordObj) {
    const joined = this.joinedData(record);
    if (joined !== undefined) {
      if (this.attachKey) {
        record.joins.set(this.attachKey, joined);
      } else {
        throw new Error('TableRecordJoin.injectJoin - cannot add joined data - no "as" or "joinName" in joinDef');
      }
    }
  }

  _performContextJoin(record): joinResult {
    if (!this.context.joins.hasKey(this.joinName)) {
      console.error('cannot find ', this.joinName, 'in', this.context.joins.store);
      throw new Error(`TableRecordJoin._performContextJoin join - bad join name ${  this.joinName}`);
    }
    const def: joinDefObj = this.context.joins.get(this.joinName);
// @TODO: cache
    if (def?.from?.table === record.tableName) {
      return this._joinItemTo(record, def.from, def.to);
    }
    if (def?.to?.table === record.tableName) {
      return this._joinItemTo(record, def.to, def.from);
    }
    return undefined;
  }

  protected _joinItemTo(record: tableRecordObj, localConn: joinConnObj, foreignConn: joinConnObj): joinResult {
    let foreignKeyValue = record.key;
    if (localConn.key) {
      foreignKeyValue = create(record.data).get(localConn.key);
    }

    if (!this.context.hasTable(foreignConn.table)) {
      throw new Error('_joinItemTo: other table is not present')
    }

    const matchFn = (otherItem, otherKey) => {
      if (foreignConn.key) {
        if (create(otherItem).get(foreignConn.key) === foreignKeyValue) {
          return true;
        }
      } else if (otherKey === foreignKeyValue) {
        return true;
      }
      return false;
    }

    const otherTable : tableObj  = this.context.table(foreignConn.table);
    let found = otherTable.data.cloneShallow()
      .filter(matchFn)
      .map((_data, otherKey)=> new TableRecord(this.context, {table: foreignConn.table, key: otherKey})).items

    if ((foreignConn.frequency === joinFreq.noneOrOne) || (foreignConn.frequency === joinFreq.one)) {
      found = found.unshift();
    }

    return found;
  }

  /**
   * the "key" of the join -- for retrieving joins from cntext;
   * @protected
   */
  protected get joinName() {
    if (typeof this.joinDef === 'string') {
      return this.joinDef;
    }
    if (this.joinDef.joinName) {
      return this.joinDef.joinName;
    }
    return undefined;
  }

  protected get attachKey() {
    if (typeof this.joinDef === 'string') {
      return this.joinDef;
    }
    if (this.joinDef.as) {
      return this.joinDef.as;
    }
    if (this.joinDef.joinName) {
      return this.joinDef.joinName;
    }
    return undefined;
  }

  _performLocalJoin(record): joinResult {
    if (!this.joinDef.connections) throw new Error('_performLocalJoin requires connections');

    const [fromDef, toDef] = this.joinDef?.connections;
// @TODO: cache
    if (fromDef?.table === record.tableName) {
      return this._joinItemTo(record, fromDef, toDef);
    }
    if (toDef?.table === record.tableName) {
      return this._joinItemTo(record, toDef, fromDef);
    }
    return undefined;
  }

  protected joinedData(record: tableRecordObj): joinResult {
    const {key, data} = record;
    if (key === 'undefined' || data  === 'undefined') {
      return undefined;
    }

    if (this.joinDef.joinName) {
      return this._performContextJoin(record);
    }

    if (this.joinDef.connections) {
      return this._performLocalJoin(record);
    }
  }
}
