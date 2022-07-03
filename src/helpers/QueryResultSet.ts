import create from '@wonderlandlabs/collect';
import { baseObj, queryDef, recordObj, recordSetCollection } from "../types";
import TableRecordJoin from "./TableRecordJoin";
import whereFn from "./whereFn";
import { binaryOperator } from "../constants";

export class QueryResultSet {
  private query: queryDef;

  private base: baseObj;

  constructor(base: baseObj, query: queryDef) {
    this.query = query;
    this.base = base;
  }

  get tableName() {
    return this.query.tableName;
  }

  get table() {
    return this.base.table(this.tableName);
  }

  // the base, un-joined records, with no joins
  get records() {
    const { table, query } = this;
    let records: recordSetCollection;
    if (query.key) {
      records = table.data.cloneEmpty();
      const record = table.recordForKey(query.key);
      if (record) {
        records.set(record.key, record);
      }
    } else {
      records = table.data.cloneShallow().map((_item, key) => table.recordForKey(key));
    }

    if (query.where) {
      const wf = whereFn(query);
      records.filter(wf);
    }

    query.joins?.forEach((joinDef) => {
      const localCache = new Map();
      const helper = new TableRecordJoin(this.base, joinDef, query);

      if (helper.localConn && helper.foreignConn) {
        const { baseJoinDef, localConn, foreignConn } = helper;
        const localKeyName = localConn.key;
        const foreignKeyName = foreignConn.key;
        const foreignTableName = foreignConn.tableName;
        const localTableName = localConn.tableName;
        const {joinTableName} = baseJoinDef;
        const joinLocalKeyName = localConn.joinTableField || localTableName;
        const joinForeignKeyName = foreignConn.joinTableField || foreignTableName;

        if (!this.base.hasTable(foreignTableName)) {
          return;
        }

        let joinTable;
        if (joinTableName) {
          if (!this.base.hasTable(joinTableName)) {
            return;
          }
          joinTable = this.base.table(joinTableName);
        }

        records.forEach((record: recordObj, key) => {

          let localKey = key;
          if (localKeyName) {
            localKey = record.get(localKeyName);
          }
          if (localKeyName && localCache.has(localKey)) {
            record.addJoin(helper.attachKey, localCache.get(localKey));
          } else if (joinTableName) {
            const joinFTQuery = {
              tableName: joinTableName,
              where: {
                field: joinLocalKeyName,
                test: binaryOperator.eq,
                against: localKey
              }
            };

            const joinRecords = joinTable.query(joinFTQuery);
            const foreignKeys = joinRecords.map((jr: recordObj) => create(jr.data).get(joinForeignKeyName));

            const match = new QueryResultSet(this.base, {
              tableName: foreignTableName,
              where: (fr) => foreignKeys.includes(fr.key),
              joins: joinDef.joins
            }).records;
            if (localKeyName) {
              localCache.set(localKey, match);
            }
            record.addJoin(helper.attachKey, match);
          } else {
            // default - match the local value to the foreign reords' key
            let where = (foreignRecord) => foreignRecord.key === localKey;

            if (foreignKeyName) { // alternate -- match to a specific  field
              where = (foreignRecord) => foreignRecord.get(foreignKeyName) === localKey;
            }

            const matchingCollection = new QueryResultSet(this.base, {
              tableName: foreignTableName,
              where,
              joins: joinDef.joins
            });

            let match = matchingCollection.records;

            // console.log('from ', record.tableName, ' join ', helper.localConn, 'to', helper.foreignConn, 'plural is ', helper.foreignIsPlural,);
            if (!helper.foreignIsPlural) {
              match = (match && (match.length > 0)) ? match[0] : null;
            }
            if (localKeyName) {
              localCache.set(localKey, match);
            }
            record.addJoin(helper.attachKey, match);
          }
        });
      }
    });

    return records.cloneShallow().map((r) => r.value).items
  }


}

export default QueryResultSet;
