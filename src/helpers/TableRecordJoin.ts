import {create} from '@wonderlandlabs/collect';
import {contextObj, joinConnObj, joinDefObj, joinResult, queryJoinDef, tableRecordObj} from "../types";
import {joinFreq} from "../constants";
import TableRecord from "./TableRecord";

export default class TableRecordJoin {
  private joinDef: queryJoinDef;

  private context: contextObj;

  constructor(joinDef: queryJoinDef, context) {
    this.joinDef = joinDef;
    this.context = context;
  }

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

    if (def?.from?.table === record.tableName) {
      return this._joinItemTo(record, def.from, def.to);
    }
    if (def?.to?.table === record.tableName) {
      return this._joinItemTo(record, def.to, def.from);
    }
    return undefined;
  }

  protected _joinItemTo(record: tableRecordObj, joinFrom, joinOther: joinConnObj): joinResult {
    let foreignKey = record.key;
    if (joinFrom.key) {
      foreignKey = joinFrom.key;
    }

    const foreignKeyValue = create(record.data).get(foreignKey);

    if (!this.context.hasTable(joinOther.table)) {
      throw new Error('_joinItemTo: other table is not present')
    }

    const matchFn = (otherItem, otherKey) => {
      if (joinOther.key) {
        if (create(otherItem).get(joinOther.key) === foreignKeyValue) {
          return true;
        }
      } else if (otherKey === foreignKeyValue) {
        return true;
      }
      return false;
    }

    const otherTable = this.context.table(joinOther.table);
    let found;
    let trjs;
    if (typeof this.joinDef === 'object') {
        trjs = this.joinDef.joins?.map((join) => new TableRecordJoin(join, this.context));
    }

    switch (joinOther.frequency) {
      case joinFreq.noneOrOne:
      case joinFreq.one:
        found = otherTable.data.reduce((memo, otherItem, otherKey, _s, stopper) => {
          if (matchFn(otherItem, otherKey)) {
            stopper.final();
            return new TableRecord(otherTable, otherKey);
          }
          return memo;
        }, undefined);
        if (found && trjs && trjs.length) {
          trjs.forEach((trj) => {
            trj.injectJoin(found);
          });
        }
        break;

      case joinFreq.oneOrMore:
      case joinFreq.noneOrMore:
        found = otherTable.data.cloneShallow()
          .map((foundItem, foundKey) => matchFn(foundItem, foundKey) ? new TableRecord(otherTable, foundKey) : null).filter((maybeRecord) => maybeRecord).items;
        if (typeof this.joinDef === 'object') {
          if (trjs && trjs.length) {
            found.forEach((joinedRecord: tableRecordObj) => {
              trjs.forEach((trj) => {
                trj.injectJoin(joinedRecord);
              });
            })
          }
        }
        break;

      default:
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

  protected joinedData(record: tableRecordObj): joinResult {
    const {key} = record;
    const item = record.data;
    if (key === 'undefined' || item === 'undefined') {
      return undefined;
    }
    const {joinDef} = this;

    if (typeof joinDef === 'string') {
      return this._performContextJoin(record);
    }

    if (typeof joinDef === 'object') {
      if (joinDef.map) {
        return joinDef.map(record, joinDef.args);
      }
      if (joinDef.joinName) {
        return this._performContextJoin(record);
      }
    }

    throw new Error('TableRecordJoin: joinedData -- join needs a named join or a join fn');
  }
}
