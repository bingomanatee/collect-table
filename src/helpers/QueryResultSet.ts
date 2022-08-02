import { create } from '@wonderlandlabs/collect';
import { baseObj, queryDef, recordSetCollection } from '../types';
import TableRecordJoin from './TableRecordJoin';
import whereFn from './whereFn';
import recordArrayToMap from './RecordArrayToMap';

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
        const foreignRecords = helper.getJoinedRecords(recordCollection);
        helper.foreignTable?.query({
          tableName: helper.foreignTable.name || '',
          filter: (_table) => foreignRecords.items,
          joins: joinDef.joins
        });
      }
    });

    return recordCollection.items;
  }
}

export default QueryResultSet;
