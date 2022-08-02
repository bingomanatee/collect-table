import { create } from '@wonderlandlabs/collect';
import { baseObj, queryDef, recordSetCollection } from '../types';
import TableRecordJoin from './TableRecordJoin';
import whereFn from './whereFn';
import { emitterMap } from './emitterMap';
import getRecordField from './getRecordField';
import recordArrayToMap from './RecordArrayToMap';
import { joinForm } from '../constants';

export class QueryResultSet {
  private query: queryDef;

  private readonly base: baseObj;

  constructor (base: baseObj, query: queryDef) {
    this.query = query;
    this.base = base;
  }

  get tableName () {
    return this.query.tableName;
  }

  get table () {
    return this.base.table(this.tableName);
  }

  // the base, un-joined records, with no joins
  get records () {
    const { table, query } = this;
    let recordCollection: recordSetCollection = new Map();
    if (query.key) {
      const record = table.recordForKey(query.key);
      if (record) {
        recordCollection.set(record.key, record);
      }
    } else if (query.filter) {
      recordCollection = recordArrayToMap(query.filter(table));
    } else {
      recordCollection = recordArrayToMap(table.records());
    }
    recordCollection = create(recordCollection);

    if (query.where) {
      const wf = whereFn(query);
      recordCollection.filter(wf);
    }

    query.joins?.forEach((joinDef) => {
      const helper = new TableRecordJoin(this.base, joinDef, query);

      if (helper.localConn && helper.foreignConn) {
        const [localRecords, foreignRecords, joinKeys] = helper.getJoinedRecords(recordCollection);

        const decoratedForeignRecords = (joinDef.joins?.length
          ? helper.foreignTable?.query({
            tableName: helper.foreignTable.name || '',
            filter: (_table) => foreignRecords,
            joins: joinDef.joins
          })
          : foreignRecords) || [];
        const fKey = helper.foreignKey;
        let foreignRecordMap = emitterMap(decoratedForeignRecords, (records, addKey) => {
          records.forEach((record) => {
            addKey(fKey ? getRecordField(record, fKey) : record.key, record);
          });
        });

        if (helper.joinForm === joinForm.manyToMany) {
          foreignRecordMap = emitterMap(joinKeys, (keys, addKey) => {
            keys.forEach((keyPair) => {
              const [localKey, foreignKey] = keyPair;
              if (foreignRecordMap.hasKey(foreignKey)) {
                addKey(localKey, foreignRecordMap.get(foreignKey));
              } else {
                console.log('cannot find foreign key', foreignKey, 'in', foreignRecordMap.store);
              }
            });
          });
        }

        const { localKey } = helper;
        localRecords.forEach((record) => {
          if (record) {
            const localKeyValue = localKey ? getRecordField(record, localKey) : record.key;
            if (foreignRecordMap.hasKey(localKeyValue)) {
              let joins = foreignRecordMap.get(localKeyValue);
              if (joins && joins.length) {
                if (!helper.foreignIsPlural) {
                  joins = joins[0];
                }
                record.addJoin(helper.attachKey, joins);
              }
            }
          }
        });
      } else {
        console.warn('------ cannot find connections in ', helper);
      }
    });

    return recordCollection.items;
  }
}

export default QueryResultSet;
