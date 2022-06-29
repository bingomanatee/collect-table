import TableRecordJoin from "./TableRecordJoin";
import { contextObj } from "../types";
import DataSet from "./DataSet";

function joinMap(joinHelper: TableRecordJoin, context: contextObj) {
  if (joinHelper.joinDef.joins) {
    return (record) => {
      // @ts-ignore
      const joins = [...joinHelper.joinDef.joins];
      const query = {
        tableName: record.tableName,
        key: record.key,
        joins
      }

      const subData = context.query(query);
      return subData.value.firstItem;
    }
  }
  return undefined;
}

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

  const map = joinMap(joinHelper, context);

  if (tableName && context.hasTable(tableName)) {
    return new DataSet({
      sourceTable: tableName,
      context,
      keys: uniqueKeys,
      map
    });
  }
  return null;
}

  export default recordsForJoin;
