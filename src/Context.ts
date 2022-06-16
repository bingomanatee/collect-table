import create from '@wonderlandlabs/collect';
import EventEmitter from 'emitix';
import {Change} from './Change';
import {changeObj, contextObj, contextOptionsObj, mapCollection, tableDefObj, tableOptionsObj,} from './types';
import {CollectionTable} from './CollectionTable';
import TableJoin from "./TableJoin";

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
    if (options) {
      this.addOptions(options);
    }
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

  addOptions(_options?: contextOptionsObj) {
    if (_options?.joins) {
      _options.joins.forEach((join) => this.addJoin(join));
    }
  }

  private _nameJoin(joinDef) {
    const props = create([joinDef.from.table]);
    if (joinDef.from.key) {
      props.addAfter(joinDef.from.key);
    }
    props.addAfter(joinDef.to.table)
    if (joinDef.to.key) {
      props.addAfter(joinDef.to.key);
    }
    while (this.joins.hasKey(props.store.join('_'))){
      if( typeof props.lastItem === 'number') {
        props.set(props.size - 1, props.lastItem + 1);
      } else {
        props.addAfter(2);
      }
    }
    return props.store.join('_');
  }

  addJoin(join) {
    const joinDef = new TableJoin(this, join);
    if (!joinDef.name) {
      joinDef.name = this._nameJoin(joinDef);
    }
    this.joins.set(joinDef.name, joinDef);
  }

  restoreTable(name: string, tableCollection: mapCollection) {
    if (this.tables.hasKey(name)) {
      this.tables.get(name).restore(tableCollection);
    }
  }

  hasTable(name: string) {
    return this.tables.hasKey(name);
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

  private addTable(def: tableDefObj | string) {
    if (typeof def === 'string') {
      this.table(def);
    } else {
      this.tables(def.name, def);
    }
  }
}
