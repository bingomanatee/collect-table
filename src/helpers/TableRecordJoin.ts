import { create, util } from '@wonderlandlabs/collect';
import { contextObj, joinConnObj, joinDefObj, queryJoinDef } from "../types";
import { joinFreq } from "../constants";
import TableRecord from "./TableRecord";

const { clone, e } = util;

export default class TableJoin {
  private joinDef: queryJoinDef;

  private context: contextObj;

  constructor(joinDef: queryJoinDef, context) {
    this.joinDef = joinDef;
    this.context = context;
  }

  joinedRecord(record: TableRecord) {
    const joined = this.joinedData(record);
    const target = create(clone(record.data));
    if (joined !== undefined) {
      if (this.joinDef.as) {
        target.set(this.joinDef.as, joined);
      } else if (this.joinDef.joinName) {
        target.set(this.joinDef.joinName, joined);
      } else {
        console.warn('table joinDef requires as or joinName');
      }
    }
    return record.clone(target.store);
  }

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

  protected joinedData(record: TableRecord) {
    const {key} = record;
    const item = record.data;
    if (key === 'undefined' || item === 'undefined') {
      return undefined;
    }
    if (this.joinDef.joinName) {
      if (!this.context.joins.hasKey(this.joinDef.joinName)) {
        throw e('join - bad join name', { item, joinDef: this.joinDef, table: this });
      }
      const def: joinDefObj = this.context.joins.get(this.joinDef.joinName);
      if (def.from.table === record.tableName) {
        return this._joinItemTo(key, item, def.from, def.to);
      }
      if (def.to.table === record.tableName) {
        return this._joinItemTo(key, item, def.to, def.from);
      }
      console.warn('bad join def obj:', { item, joinDef: this.joinDef, table: this });
    }
    if (this.joinDef.join) {
      return this.joinDef.join(item, record.table, this.joinDef.args);
    }
    throw e('join needs a named join or a join fn', { item, joinDef: this.joinDef })
  }
}
