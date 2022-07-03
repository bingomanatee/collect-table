import create from '@wonderlandlabs/collect';
import EventEmitter from 'emitix';
import {Change} from './Change';
import {
  changeObj,
  baseObj,
  baseOptsObj,
  mapCollection,
  queryDef,
  tableDefObj,
  tableOptionsObj,
} from './types';
import {Table} from './Table';
import TableJoin from "./TableJoin";
import QueryFetchStream from "./helpers/QueryFetchStream";

export default class Base extends EventEmitter implements baseObj {

  constructor(tables?: tableDefObj[], options?: baseOptsObj) {
    super();
    if (tables) {
      tables.forEach(def => this.addTable(def));
    }
    if (options) {
      this.addOptions(options);
    }
  }

  public activeChanges = create([]);

  protected time = 0;

  protected tables = create(new Map([]));

  public joins = create(new Map([]));

  get lastChange(): changeObj | undefined {
    return this.activeChanges.lastItem;
  }

  get now() {
    return this.time;
  }

  get next() {
    this.time += 1;
    return this.time;
  }

  addOptions(_options?: baseOptsObj) {
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
    this.activeChanges.addAfter(change);
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

    this.activeChanges.deleteItem(change);

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
      this.tables.set(name, new Table(this, name, options));
    }
    return this.tables.get(name);
  }

  private addTable(def: tableDefObj | string) {
    if (typeof def === 'string') {
      this.table(def);
    } else {
      this.table(def.name, def);
    }
  }

  query(query:  queryDef) {
    const {tableName } = query;
    if (!this.hasTable(tableName)) {
      throw new Error(`query cannot find table ${tableName}`);
    }

    return this.table(tableName)?.query(query);
  }

  queryItems(query: queryDef) {
    const result = this.query(query);
    return result? result.value.items.map(record => record.value) : [];
  }

  stream(query: queryDef, listener) {
    return new QueryFetchStream(this, query).subscribe(listener);
  }
}
