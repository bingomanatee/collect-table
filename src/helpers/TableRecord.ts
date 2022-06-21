import {create} from '@wonderlandlabs/collect';

import {
  contextObj, helperMap, joinResult,
  queryDef,
  queryJoinDef, tableRecordJoinObj, tableRecordMetaObj,
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
 * augmented by joinedRecords, aggregates, etc.
 */
export default class TableRecord implements tableRecordObj {

  constructor(context: contextObj, query: queryDef, meta?: tableRecordMetaObj) {
    this.context = context;
    this.query = query;
    if (meta) {
      const {helpers, joins} = meta;
      if (helpers) {
        this.helpers = helpers;
      } else if (joins) {
        this.helpers =  create(joins).reduce((map, join) => {
          map.set(join, new TableRecordJoin(context, join));
          return map;
        }, new Map());
      }
    }

    if (query.joins && !this.helpers) {
      this.helpers = create(query.joins).reduce((map, join) => {
        map.set(join, new TableRecordJoin(context, join));
        return map;
      }, new Map());
    }

    this.updateJoins();
  }

  private query: queryDef;

  public context: contextObj;

  private helpers?: helperMap;

  private updateJoins() {
    if (this.helpers) {
      this.helpers.forEach((helper: tableRecordJoinObj) => helper.updateJoinedRecord(this));
    }
  }

  public joinedRecords = new Map<queryJoinDef, any>();

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
    return this.context.table(this.query.table).getData(this.key);
  }

  get value() {
    if (!this.joinedRecords?.size) {
      return this.data;
    }
    this.updateJoins(); // @TODO: cache better
    const wrapped = create(this.data).clone();
    this.joinedRecords.forEach((result : joinResult | undefined, attachAs) => {
      if (result === undefined) {
        return;
      }

     if (Array.isArray(result)) {
        wrapped.set(attachAs,
          result.map((joinItem) => joinItem.value));
      } else {
        wrapped.set(attachAs, result.value);
      }
    });
    return wrapped.store;
  }
}
