import type {reduceAction} from '@wonderlandlabs/collect';
import {create} from '@wonderlandlabs/collect';
import {contextObj, dataContextObj, stringMap, tableRecordMetaObj, tableRecordObj} from "../types";
import {tableRecordState} from "../constants";

/**
 * a table record is a "decorated" record.
 * This can operate as either a "snapshot" - an emitted single data item -
 *
 *  --- or -----
 *
 * a "pointer" -- an ongoing accessor with all the data needed to get the
 * *current* data: context, key, and table name.
 *
 * In "snapshot" mode it can have an embedded data instance, potentially,
 * augmented by joins, aggregates, etc.
 */
export default class TableRecord implements tableRecordObj {

  public joins: stringMap = new Map<string, any>();

  reducer?: reduceAction;

  reducerStart?: any;

  tableName: string;

  context: contextObj;

  state?: tableRecordState;

  private readonly _key?: any;

  constructor(dataContext: dataContextObj, keyOrReducer, meta?) {
    const {name, context} = dataContext;
    if (typeof keyOrReducer === 'function') {
      this.reducer = keyOrReducer;
    } else {
      this._key = keyOrReducer;
    }
    this.tableName = name;
    this.context = context
    this.meta = meta;
  }

  private _data: any;

  get data() {
    if (this._data) {
      return this._data;
    }
    if (this.reducer) {
      if (typeof this.reducerStart === 'function') {
        return this.table.data.reduce(this.reducer, this.reducerStart(this));
      }
      return this.table.data.reduce(this.reducer, this.reducerStart);
    }
    return this.table.getData(this._key);
  }

  get key(): any {
    if (this._key !== undefined) {
      return this._key;
    }
    const {data} = this;
    if (data === undefined) {
      return undefined;
    }
    return this.table.data.keyOf(data);
  }

  private _meta?: any;

  get meta(): any {
    return this._meta;
  }

  set meta(meta: tableRecordMetaObj | ((target: TableRecord) => any) | undefined) {
    this.state = tableRecordState.new;

    if (typeof meta === 'object') {
      if ('state' in meta) {
        this.state = meta.state;
      }
      if ('start' in meta) {
        this.reducerStart = meta.start;
      }
      if ('data' in meta) {
        this._data = meta.data;
      }
      if (meta?.joins instanceof Map) {
        this.joins = meta.joins;
      }
      this._meta = meta;
    }
    if (typeof meta === 'function') {
      this.reducerStart = meta(this);
    }
  }

  get table() {
    return this.context.table(this.tableName);
  }

  get value() {
    if (!this.joins?.size) {
      return this.data;
    }
    const wrapped = create(this.data).clone();
    this.joins.forEach((join, name) => {
      if (!join) {
        return;
      }
      if (join instanceof TableRecord) {
        wrapped.set(name, join.value);
      } else if (Array.isArray(join)) {
        wrapped.set(name,
          join.map((joinItem) => {
            if (joinItem instanceof TableRecord) {
              return joinItem.value;
            }
            return joinItem
          }));
      } else {
        wrapped.set(name, join);
      }
    });
    return wrapped.store;
  }

  /**
   * returns a "hard snapshot" of the current data; potentially with joins etc.
   * @param newData
   */
  clone(newData) {
    return new TableRecord({name: this.tableName, context: this.context},
      this.key, this._makeMeta({
        data: newData
      }))
  }

  private _makeMeta(overrides = {}) {
    const meta: tableRecordMetaObj = {};
    if (this.joins.size) {
      meta.joins = new Map(this.joins);
    }
    if (this._data) {
      meta.data = this._data;
    }
    if (this.reducerStart) {
      meta.start = this.reducerStart;
    }
    if (this.state !== tableRecordState.new) {
      meta.state = this.state;
    }
    return {...meta, ...overrides};
  }

}
