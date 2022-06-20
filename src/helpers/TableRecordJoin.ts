import { create, utils } from '@wonderlandlabs/collect';
import {contextObj, joinConnObj, joinDefObj, joinResult, queryJoinDef} from "../types";
import { joinFreq } from "../constants";
import TableRecord from "./TableRecord";

const { e } = utils;

export default class TableRecordJoin {
  private joinDef: queryJoinDef;

  private context: contextObj;

  constructor(joinDef: queryJoinDef, context) {
    this.joinDef = joinDef;
    this.context = context;
  }

  injectJoin(record: TableRecord) {
    const joined = this.joinedData(record);
    if (joined) {
      if (this.joinDef.as) {
        record.joins.set(this.joinDef.as, joined);
      } else if (this.joinDef.joinName) {
        record.joins.set(this.joinDef.joinName, joined);
      } else {
        throw e('cannot add joined data - no "as" or "joinName" in joinDef', {
          TableRecordJoin: this,
          joinDef: this.joinDef, record
        })
      }
    }
  }

  protected _joinItemTo(key, item, joinFrom, joinOther: joinConnObj) : joinResult {
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
    let found;
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

        break;

      case joinFreq.oneOrMore:
      case joinFreq.noneOrMore:
        found = otherTable.data.cloneShallow()
          .map((foundItem, foundKey) => matchFn(foundItem, foundKey) ? new TableRecord(otherTable, foundKey) : null).filter((maybeRecord) => maybeRecord).items;
        break;

      default:
    }
    return found;
  }

  protected joinedData(record: TableRecord): joinResult {
    const { key } = record;
    const item = record.data;
    if (key === 'undefined' || item === 'undefined') {
      return undefined;
    }
    if (this.joinDef.joinName) {
      if (!this.context.joins.hasKey(this.joinDef.joinName)) {
        throw e('join - bad join name', { item, joinDef: this.joinDef, table: this });
      }
      return this._performContextJoin(record);
    }
    if (this.joinDef.join) {
      return this.joinDef.join(record, this.joinDef.args);
    }
    throw e('join needs a named join or a join fn', { item, joinDef: this.joinDef })
  }

  _performContextJoin(record) : joinResult {
    const { key } = record;
    const item = record.data;
    const def: joinDefObj = this.context.joins.get(this.joinDef.joinName);
    if (def.from.table === record.tableName) {
      return this._joinItemTo(key, item, def.from, def.to);
    }
    if (def.to.table === record.tableName) {
      return this._joinItemTo(key, item, def.to, def.from);
    }
    console.warn('bad join def obj:', { item, joinDef: this.joinDef, table: this });
    return undefined;
  }
}
