import {create} from '@wonderlandlabs/collect';
import produce from 'immer';

import {
  contextObj,
  queryDef,
  queryJoinDef, tableRecordJoinObj,
  tableRecordObj
} from "../types";
import TableRecordJoin from "./TableRecordJoin";

/**
 * a table record is a "decorated" record.
 * This can operate as either a "snapshot" - an emitted single data item -
 *
 *  --- or -----
 *
 * a "pointer" -- an ongoing accessor with all the data needed to get the
 * *current* data: context, key, and table name.
 *
 * In "snapshot" mode it can have an embedded data instance, potentially,
 * augmented by joins, aggregates, etc.
 */
export default class TableRecord implements tableRecordObj {

  constructor(context: contextObj, query: queryDef, helpers?: Map<queryJoinDef, tableRecordJoinObj>) {
    this.context = context;
    this.query = query;
    if (query.joins) {
      this.helpers = helpers || create(query.joins).reduce((map, join) => {
        map.set(join, new TableRecordJoin(join, context));
        return map;
      }, new Map());
    }
    this.updateJoins();
  }

  private query: queryDef;

  public context: contextObj;

  private helpers?: Map<queryJoinDef, tableRecordJoinObj>;

  private updateJoins() {
    if (this.helpers) {
      this.helpers.forEach((helper: tableRecordJoinObj) => helper.injectJoin(this));
    }
  }

  public joins = new Map<queryJoinDef, any>();

  get key() {
    return this.query.key;
  }

  get tableName() {
    return this.query.table;
  }

  get table() {
    return this.context.table(this.tableName);
  }

  get data() {
    return this.context.table(this.query.table).getData(this.query.key);
  }

  get value() {
    if (!this.joins?.size) {
      return this.data;
    }
    const wrapped = create(this.data).clone();
    this.joins.forEach((join, name) => {
      if (!join) {
        return;
      }
      if (join instanceof TableRecord) {
        wrapped.set(name, join.value);
      } else if (Array.isArray(join)) {
        wrapped.set(name,
          join.map((joinItem) => {
            if (joinItem instanceof TableRecord) {
              return joinItem.value;
            }
            return joinItem
          }));
      } else {
        wrapped.set(name, join);
      }
    });
    return wrapped.store;
  }
}
