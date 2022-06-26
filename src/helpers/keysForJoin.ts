import create from '@wonderlandlabs/collect';
import TableRecordJoin from "./TableRecordJoin";
import { dataSetObj, queryDef } from "../types";
import DataSet from "../DataSet";

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
