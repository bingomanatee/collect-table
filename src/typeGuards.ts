import type{ collectionObj } from "@wonderlandlabs/collect";
import { tableRecordObj } from "./types";

export function isCollection(target): target is collectionObj<any, any, any> {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return 'store,keys,hasItem,hasKey'.split(',').every((f) => f in target);
}

export function isTableRecord(target) : target is tableRecordObj {
  if (!(target && typeof target === 'object')) {
    return false;
  }

  return 'key,data,context'.split(',').every((f) => f in target);
}
