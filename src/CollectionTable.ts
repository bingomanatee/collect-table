import create, {types} from '@wonderlandlabs/collect';
import {journalize} from "./Journalize";

type optionsObj = ({
  keyProvider?: (target: any, meta: any) => any;
})

const KeyProviders = {
  _defaultIndex: 0,
  Default: () => {
    return ++KeyProviders._defaultIndex;
  }
}

export enum tableChangeTypeEnum {
  added,
  updated,
  deleted,
}

export type anyMap = Map<any, any>;

export type tableItemChange = { key: any, old?: any, now?: any, type: tableChangeTypeEnum };

export type completeUpdate = { oldTable?: anyMap[], newTable: anyMap, completeUpdate: boolean }

export type changeSet = tableItemChange[] | completeUpdate;

export type mapCollection = types.collectionObj<Map<any, any>, any, any>;

export class Table {
  journal: changeSet[] = [];
  private store: mapCollection;

  constructor(data = [], options?: optionsObj) {
    this.addOptions(options);
    // @ts-ignore
    this.store = create(new Map([]));
    this.store.onChange = (pendingStore: anyMap | undefined, action: string) => this.onStoreChange(pendingStore, action);
    this.addMany(data);
  }

  addOptions(options?: optionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options.keyProvider
    }
  }

  onStoreChange(pendingStore?: anyMap, action?: string) {
    if (pendingStore && action) {
      this.journal.push(journalize(this.store, pendingStore, action));
    }
  }

  transact(action: () => any, onError?: (err: any) => any) {
    try {
      return action();
    } catch (err) {
      if (onError) {
        return onError(err);
      } else {
        throw err;
      }
    }
  }

  private keyProvider: (target: any, meta: any) => any = () => KeyProviders.Default();

  private addMany(data: any[]) {
    let out = new Map();
    this.transact(() => {
      for (let i = 0; i < data.length; ++i) {
        const key = this.addItem(data[i]);
        out.set(key, this.store.get(key));
      }
    }, (err) => {
      return {
        error: err
      }
    })
  }

  private addItem(record: any, meta?: any) {
    const key = this.keyProvider(record, meta);
    this.store.set(key, record);
    return key;
  }
}
