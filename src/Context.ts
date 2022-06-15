import create from '@wonderlandlabs/collect';
import EventEmitter from 'emitix';
import { Change } from './Change';
import {
  changeObj,
  contextObj,
  contextOptionsObj, mapCollection,
  tableDefObj,
  tableOptionsObj,
} from './types';
import { CollectionTable } from './CollectionTable';

export default class Context extends EventEmitter implements contextObj {
  protected transactions = create([]);

  protected time = 0;

  protected tables = create(new Map([]));

  protected joins = create(new Map([]));

  constructor(tables?: tableDefObj[], options?: contextOptionsObj) {
    super();
    if (tables) {
      tables.forEach(def => this.addTable(def));
    }
    if (options) this.addOptions(options);
  }

  addOptions(_options?: contextOptionsObj) {
  }

  addJoin() {
   // const index = def.name || `join_${this.joins.size}`;
  //  this.joins.set(index, new TableJoin(this, def, index));
  }

  restoreTable(name: string, tableCollection: mapCollection){
    if (this.tables.hasKey(name)) {
      this.tables.get(name).restore(tableCollection);
    }
  }

  transact(fn) {
    const change = new Change(this);
    this.transactions.addAfter(change);
    let out;
    change.start();
    try {
      out = fn(change);
      if (change.isActive) {
        change.executed();
      }
      if (change.isActive) {
        change.validated();
      }
      if (!change.isFailed) {
        change.completed();
      }
    } catch (error) {
      change.failed(error);
      change.applyBackups();
    }

    this.transactions.deleteItem(change);

    if (change.error) {
      throw change.error;
    }
    return out;
  }

  /**
   * gets or generates a new TableCollection of a given name
   * @param name
   * @param options
   */
  table(name, options?: tableOptionsObj) {
    if (!this.tables.hasKey(name)) {
      this.tables.set(name, new CollectionTable(this, name, options));
    }
    return this.tables.get(name);
  }

  get lastChange(): changeObj | undefined {
    return this.transactions.lastItem;
  }

  get now() {
    return this.time;
  }

  get next() {
    this.time += 1;
    return this.time;
  }

  private addTable(def: tableDefObj) {
    this.tables.set(def.name, def);
  }
}
