import type{ collectionObj } from "@wonderlandlabs/collect";
import { recordObj } from "./types";

export function isCollection(target): target is collectionObj<any, any, any> {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return 'store,keys,hasItem,hasKey'.split(',').every((f) => f in target);
}

const recordFields = 'key,data,get,tableName'.split(',');
const recordLikeFields = 'key,data,tableName'.split(',');

export function isTableRecord(target, recordLike = false) : target is recordObj {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return (recordLike? recordLikeFields: recordFields).every((f) => f in target);
}
