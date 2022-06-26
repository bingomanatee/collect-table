import create, {enums} from '@wonderlandlabs/collect';
import { contextObj, dataSetObj, dataSetReducerFn, mapCollection, queryDef } from "../types";
import TableRecordJoin from "./TableRecordJoin";
import DataSet from "../DataSet";

const {FormEnum} = enums;

export function recordsForJoin(joinHelper: TableRecordJoin, keys, context: contextObj) {
  const uniqueKeys = keys.reduce((memo, subKeys) => {
    if (subKeys) subKeys.forEach((key) => memo.add(key));
    return memo;
  }, new Set());
  const tableName = joinHelper.foreignConn?.tableName;
  if (tableName && context.hasTable(tableName)) {
    return new DataSet({
      sourceTable: tableName,
      context,
      keys: uniqueKeys,
    });
  }
  return null;
}

export function keysForJoin(joinHelper: TableRecordJoin, ds: dataSetObj, query: queryDef) {
  if (!(joinHelper.localConn && joinHelper.foreignConn)) {
    return undefined; // ??
  }
  const joinedTableName = joinHelper.foreignConn.tableName;
  const foreignTableName = joinHelper.foreignConn.tableName;
  const localKeyName = joinHelper.localConn?.key;
  const foreignTable = ds.context.table(foreignTableName);
  const foreignKeyName = joinHelper.foreignConn.key;

  return new DataSet({
    sourceTable: query.tableName,
    context: ds.context,
    keys: ds.keys,
    map: (tableRecord) => {
      const localKey = localKeyName ? tableRecord.get(localKeyName) : tableRecord.key;
      const dataSet = new DataSet({
        sourceTable: joinedTableName,
        context: ds.context,
        selector: (keys) => {
          if (foreignKeyName) {
            return create(keys).filter((key) => {
              const foreignRecord = foreignTable.recordForKey(key);
              return foreignRecord.exists && foreignRecord.get(foreignKeyName) === localKey;
            }).store;
          }
          return keys.filter((key) => key === localKey);
        }
      });

      return dataSet.keys;
    }
  });
}

export default (query: queryDef) => {
  const reducer: dataSetReducerFn = (data: mapCollection,
                                     ds: dataSetObj) => {
    const joinKeyTables = create(new Map());
    const joinKeyRecords = create(new Map());

    query.joins?.forEach((join) => {
      const joinHelper = new TableRecordJoin(ds.context, join, query);

      const keysMap = keysForJoin(joinHelper, ds, query);
      if (keysMap) {
        const recordsMap = recordsForJoin(joinHelper, keysMap.data, ds.context);
        if (recordsMap && keysMap) {
          joinKeyRecords.set(joinHelper, recordsMap.data);
          joinKeyTables.set(joinHelper, keysMap.data);
        }
      }
    });

    return data.map((item, key) => {
      const target = create(item);
      if (target.form === FormEnum.scalar) {
        return item;
      }
      joinKeyTables.forEach((keys, helper: TableRecordJoin) => {
        const records = joinKeyRecords.get(helper); // foreign table keys, keyed by their IDs
        const itemKeys = keys.get(key); // foreign record keys for the current item
        const sourceTable = helper.foreignConn?.tableName;
        if (records && keys && sourceTable) {
          const mappedDataSet = new DataSet({
            sourceTable,
            source: records,
            keys: itemKeys,
            context: ds.context,
          });
          const {data: mappedData} = mappedDataSet;
          if (mappedData) {
            target.set(helper.attachKey, mappedData);
          }
        }
      });
      return target.store;
    })
  };

  return reducer;
}
