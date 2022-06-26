import TableRecordJoin from "./TableRecordJoin";
import { contextObj } from "../types";
import DataSet from "../DataSet";

export function recordsForJoin(joinHelper: TableRecordJoin, keys, context: contextObj) {
  if (!keys) {
    return undefined;
  }
  const uniqueKeys = keys.reduce((memo, subKeys) => {
    if (subKeys) {
      subKeys.forEach((key) => memo.add(key));
    }
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
