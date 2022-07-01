// import create from '@wonderlandlabs/collect';
import { contextObj, queryDef, tableRecordObj } from "./types";
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
    const { table } = this;
    let collection = table.data;
    if (this.query.key) {
      const record = table.recordForKey(this.query.key);
      collection = collection.cloneEmpty();
      if (record) {
        collection.set(record.key, record);
      }
    } else {
      collection = collection.cloneShallow().map((_item, key) => table.recordForKey(key));
    }

    if (this.query.where) {
      const wf = whereFn(this.query);
      collection = collection.filter(wf)
    }

    collection.forEach((record: tableRecordObj, key) => {
      this.query.joins?.forEach((joinDef) => {
        const localCache = new Map();
        const helper = new TableRecordJoin(this.context, joinDef, this.query);

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
            record.addJoin(helper.attachKey, match);
          }

        }
      });
    });

    return collection.cloneShallow().map((r) => r.value).items
  }


}

export default QueryResultSet;
