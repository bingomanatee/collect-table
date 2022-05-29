import { collectionObj, keyType } from '@wonderlandlabs/collect/dist/types';
import { clone } from '@wonderlandlabs/collect/dist/utils/change';
import {
  anyMap,
  changeSet,
  completeUpdate,
  mapCollection,
  tableChangeTypeEnum,
  tableItemChange,
} from './types';

class ItemChange implements tableItemChange {
  constructor(key: keyType, oldItem: any, newItem: any) {
    this.key = key;
    this.old = clone(oldItem);
    this.now = clone(newItem);
  }

  key: any;
  now: any;
  old: any;
  type = tableChangeTypeEnum.updated;
}

class ItemDeletion implements tableItemChange {
  constructor(key: keyType, oldItem: any) {
    this.key = key;
    this.old = oldItem;
  }

  key: any;
  old: any;
  type = tableChangeTypeEnum.deleted;
}

class ChangeEverything implements completeUpdate {
  constructor(
    collection: collectionObj<anyMap, any, any>,
    pendingStore: anyMap
  ) {
    this.oldTable = collection.store ? clone(collection.store) : new Map();
    this.newTable = clone(pendingStore);
  }

  completeUpdate = true;
  newTable: anyMap;
  oldTable: anyMap[];
}

export function journalize(
  collection: mapCollection,
  pendingStore: anyMap,
  action: string
) {
  if (action === 'constructor') {
    return new ChangeEverything(collection, pendingStore);
  }
  let changeList: changeSet = [];

  function journalizeEverything() {
    changeList = new ChangeEverything(collection, pendingStore);
  }

  collection.forEach((oldItem, key, _store, stopper) => {
    if (pendingStore.has(key)) {
      const newItem = pendingStore.get(key);
      if (
        !(collection.compItems
          ? collection.compItems(newItem, oldItem)
          : newItem === oldItem)
      ) {
        if (Array.isArray(changeList))
          changeList.push(new ItemChange(key, oldItem, newItem));
      }
    } else {
      if (Array.isArray(changeList))
        changeList.push(new ItemDeletion(key, oldItem));
    }
    if (Array.isArray(changeList) && changeList.length > 10) {
      journalizeEverything();
      stopper.stop();
    }
  });

  return changeList;
}
