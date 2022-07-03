import type{ collectionObj } from "@wonderlandlabs/collect";
import { recordObj } from "./types";

export function isCollection(target): target is collectionObj<any, any, any> {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return 'store,keys,hasItem,hasKey'.split(',').every((f) => f in target);
}

export function isTableRecord(target) : target is recordObj {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return 'key,data,tableName'.split(',').every((f) => f in target);
}
