import { create } from '@wonderlandlabs/collect';
import { baseObj, queryDef, recordObj, recordSetCollection } from "../types";
import TableRecordJoin from "./TableRecordJoin";
import whereFn from "./whereFn";
import { emitterMap } from "./emitterMap";
import { getRecordField } from "./getRecordField";

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
      records = create(new Map());
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
      const helper = new TableRecordJoin(this.base, joinDef, query);

      if (helper.localConn && helper.foreignConn) {
        const { baseJoinDef, localConn, foreignConn, attachKey } = helper;
        const { key: localKeyName, tableName: localTableName } = localConn;
        const { key: foreignKeyName, tableName: foreignTableName } = foreignConn;
        const { joinTableName } = baseJoinDef;
        const joinLocalKeyName = localConn.joinTableField || localTableName;
        const joinForeignKeyName = foreignConn.joinTableField || foreignTableName;

        if (!this.base.hasTable(foreignTableName)) {
          console.warn('cannot find join table ', foreignTableName)
          return;
        }

        let joinTable;
        if (joinTableName) {
          if (!this.base.hasTable(joinTableName)) {
            console.warn('cannot find joinTableName table ', joinTableName)
            return;
          }
          joinTable = this.base.table(joinTableName);
        }

        const foreignQuery = {
          tableName: foreignTableName,
          where: joinDef.where,
          joins: joinDef.joins
        };

        const foreignRecords = this.base.table(foreignTableName).query(foreignQuery);

        let matchMap;

        if (joinTableName) {
          const matchesByKey = emitterMap(foreignRecords, (ms, addKey) => {
            ms.forEach(record => {
              addKey(record.key, record)
            });
          });
          matchMap = emitterMap(joinTable.records, (joinRecords, addKey) => {
            joinRecords.forEach((record) => {
              const localJoinKey = getRecordField(record, joinLocalKeyName);
              const foreignJoinKey = getRecordField(record, joinForeignKeyName);
              if (localJoinKey === undefined || foreignJoinKey === undefined) {
                return;
              }
              const matchedRecord = matchesByKey.get(foreignJoinKey);
              if (!matchedRecord) {
                // console.log('cannot find ', foreignJoinKey, 'in', matchesByKey.store);
              } else {
                addKey(localJoinKey, matchedRecord);
              }
            });
          });
          matchMap.map((data) => data.reduce((list, item) => {
            if (Array.isArray(item)) {
              return list.concat(item);
            }
            return [...list, item];
          }, []))
        } else {
          matchMap = emitterMap(foreignRecords, (matchRecords, addKey) => {
            matchRecords.forEach((matchedRecord) => {

              const key = foreignKeyName ? getRecordField(matchedRecord, foreignKeyName) : matchedRecord.key;
              try {
                if (key !== undefined) {
                  addKey(key, matchedRecord);
                }
              } catch (err) {
                // @ts-ignore
                console.log('---------------error in matching', err.message);
                console.log('record', matchedRecord, 'q', query, joinDef, 'mr', matchRecords);
              }
            });
          });
        }

        records.forEach((record: recordObj) => {
          const localKey = localKeyName ? record.get(localKeyName) : record.key;
          if (localKey === undefined) {
            return;
          }

          if (matchMap.hasKey(localKey)) {
            let result = matchMap.get(localKey);
            if (result.length === 0) {
              return;
            }
            if (!joinTableName && !foreignKeyName && Array.isArray(result) && result.length === 1) {
              result = result[0];
            }
            record.addJoin(attachKey, result);
          }
        });
      }
    });

    return records.items
  }

}

export default QueryResultSet;
