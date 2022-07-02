// import create from '@wonderlandlabs/collect';
import { contextObj, queryDef, recordObj, recordSetCollection } from "./types";
import TableRecordJoin from "./helpers/TableRecordJoin";
import whereFn from "./helpers/whereFn";

export class QueryResultSet {
  private query: queryDef;

  private context: contextObj;

  constructor(context: contextObj, query: queryDef) {
    this.query = query;
    this.context = context;
  }

  get tableName() {
    return this.query.tableName;
  }

  get table() {
    return this.context.table(this.tableName);
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

    records.forEach((record: recordObj, key) => {
      query.joins?.forEach((joinDef) => {
        const localCache = new Map();
        const helper = new TableRecordJoin(this.context, joinDef, query);

        if (helper.localConn && helper.foreignConn) {
          const localKeyName = helper.localConn.key;
          const foreignKeyName = helper.foreignConn.key;
          const foreignTableName = helper.foreignConn?.tableName;
          // @TODO: index better

          let localKey = key;
          if (localKeyName) {
            localKey = record.get(joinDef.joinName && localKeyName);
          }
          if (localKeyName && localCache.has(localKey)) {
            record.addJoin(helper.attachKey, localCache.get(localKey));
          } else {
            // default - match the local value to the foreign reords' key
            let where = (foreignRecord) => foreignRecord.key === localKey;

            if (foreignKeyName) { // alternate -- match to a specific  field
              where = (foreignRecord) => foreignRecord.get(foreignKeyName) === localKey;
            }

            const matchingCollection = new QueryResultSet(this.context, {
              tableName: foreignTableName,
              where,
              joins: joinDef.joins
            });

            const match = matchingCollection.records;
            if(localKeyName) {
              localCache.set(localKey, match);
            }
            // console.log('from ', record.tableName, ' join ', helper.localConn, 'to', helper.foreignConn, 'plural is ', helper.foreignPlural,);
              if (helper.foreignPlural) {
                record.addJoin(helper.attachKey, match);
              } else {
                record.addJoin(helper.attachKey, (match && (match.length > 0)) ? match[0] : null);
              }
          }
        }
      });
    });

    return records.cloneShallow().map((r) => r.value).items
  }


}

export default QueryResultSet;
