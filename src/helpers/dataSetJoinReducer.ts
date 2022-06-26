import create, { enums } from '@wonderlandlabs/collect';
import { dataSetObj, dataSetReducerFn, mapCollection, queryDef } from "../types";
import TableRecordJoin from "./TableRecordJoin";
import DataSet from "../DataSet";
import { recordsForJoin } from "./recordsForJoin";
import { keysForJoin } from "./keysForJoin";
import TableRecord from "./TableRecord";

export { recordsForJoin, keysForJoin };
const {FormEnum} = enums;

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
            const joined = mappedData.cloneShallow().map((fItem, fKey) => new TableRecord(ds.context, sourceTable, fKey, fItem).value).items
            target.set(helper.attachKey, joined);
          }
        }
      });
      return target.store;
    })
  };

  return reducer;
}
