import create from '@wonderlandlabs/collect';
//import { journalize } from './Journalize';
import {
  contextObj,
  mapCollection,
  tableOptionsObj,
  recordCreatorFn,
  tableObj,
} from './types';
import { TableRecord } from './TableRecord';

const KeyProviders = {
  _defaultIndex: 0,
  Default: () => {
    return ++KeyProviders._defaultIndex;
  },
};

export enum tableRecordState {
  new,
  saved,
  deleted,
}

export class CollectionTable implements tableObj {
  // journal: changeSet[] = [];
  protected collection: mapCollection;
  protected recordCreator: recordCreatorFn | undefined;
  /**
   * an index of Change timestamps against replacement tables.
   * During transactions, values from the versions tables are used
   * @protected
   */
  protected versions: mapCollection = create(new Map([]));
  public context: contextObj;
  name: string;

  constructor(
    context: contextObj,
    name: string,
    data?: any[],
    options?: tableOptionsObj
  ) {
    this.context = context;
    this.name = name;
    this.collection = create(new Map([]));
    this.addOptions(options);
    if (data) this.addMany(data);
  }

  protected addOptions(options?: tableOptionsObj) {
    if (options?.keyProvider) {
      this.keyProvider = options.keyProvider;
    }
    if (options?.recordCreator) {
      this.recordCreator = options.recordCreator;
    }
  }

  transact(action: (context: contextObj) => any, onError?: (err: any) => any) {
    try {
      return this.context.transact(action);
    } catch (err) {
      if (onError) {
        return onError(err);
      } else {
        throw err;
      }
    }
    return this;
  }

  private keyProvider: (target: any, meta: any) => any = () =>
    KeyProviders.Default();

  public addMany(data: any[]) {
    const out = new Map();
    return this.transact(
      () => {
        for (let i = 0; i < data.length; ++i) {
          const key = this.addRecord(data[i]);
          out.set(key, this.collection.get(key));
        }
      },
      err => {
        return {
          error: err,
        };
      }
    );
  }

  /**
   * retrieves (dynamically creates if needed)
   * a collection indexed by the most recent change --
   * or the base collection if there is none.
   * @protected
   */
  protected get currentCollection(): mapCollection {
    const last = this.context.lastChange;
    if (!last) {
      return this.collection;
    }
    if (!this.versions.hasKey(last.time)) {
      this.versions.set(last.time, create(new Map([])));
    }
    return this.versions.get(last.time);
  }

  public addRecord(record: any, meta?: any) {
    const key = this.keyProvider(record, meta);
    let toAdd = record;
    if (this.recordCreator) {
      toAdd = this.recordCreator(record, key);
    }

    this.currentCollection.set(key, new TableRecord(this, key, toAdd));
    return key;
  }

  public getRecord(key: any) {
    if (this.currentCollection.hasKey(key)) {
      return this.currentCollection.get(key);
    }
    return this.versions.reduce(
      (memo, collection, time) => {
        if (collection.hasKey(key) && memo.time < time) {
          const record = collection.get(key);
          return { record, time };
        }
        return memo;
      },
      { record: undefined, time: 0 }
    );
  }
}
