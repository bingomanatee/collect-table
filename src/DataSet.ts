import isEqual from 'lodash.isequal';
import {
  contextObj,
  dataSetSelectorFn,
  dataSetObj,
  dataSetParams,
  mapCollection,
  dataSetReducerFn,
  dataSetMapFn,
} from "./types";

/**
 * dataSet is an excerpt OR extrapolation from a group of records in a tableName.
 * In its minimal form (i.e., only context and tableName are set), it returns a straight reference
 * to the tables' data and keys
 * 1. tableName, table
 *   the point of reference for the data; the table for which the data is initially pulled
 *
 * 2. source
 *    unless overridden by injection this is the table data
 *
 * 3. keys
 *    the source's keys -- or if there is a selector, a subset of those keys
 *    may be overridden/injected at start
 *
 * 4. selected (internal)
 *    the subset of source defined by keys;
 *
 * 5. data
 *    if there is a map function, it is selected,
 *    cloned and mapped by the function. Otherwise, equal to selected
 *
 * 5. value
 *    if there is a reducer, it is the data, reduced to a value that may or may not be a map
 *
 *
 */
export class DataSet implements dataSetObj {
  constructor({
                context,
                sourceTable,
                source,
                keys,
                selector,
                data,
                map,
                reducer,
                meta,
                value,
              }: dataSetParams) {
    this.context = context;
    this.tableName = sourceTable;
    this._keys = keys;
    this._data = data;
    this._source = source;
    this.map = map;
    this.reducer = reducer;
    this.selector = selector;
    this.meta = meta;
    if (value !== undefined) {
      this._value = value;
    }
  }

  private map?: dataSetMapFn;

  private _source: any;

  get source(): any {
    if (!this._source) {
      return this.table.data;
    }
    return this._source;
  }

  protected selector?: dataSetSelectorFn;

  private _keys?: any[];

  get baseKeys(): any[] {
    if (this._keys) {
      return this._keys;
    }
    return this.source.keys;
  }

  /**
   * an ordered list of the subset of records in this collection.
   * if there is a keysOperator, it modifies either the baseKeys or the data's original key set.
   */
  get keys(): any[] {
    if (this.selector) {
      return this.selector(this.baseKeys, this.source, this);
    }
    return this.baseKeys;
  }

  meta?: any;

  context: contextObj;

  tableName: string;

  protected get table() {
    return this.context.table(this.tableName);
  }

  private _data?: mapCollection;

  get selected(): mapCollection {
    if (this._data) {
      return this._data;
    }
    if (isEqual(this.keys, this.source.keys)) {
      return this.source;
    }
    const base = this.source.cloneEmpty();
    this.keys.forEach((key) => base.set(key, this.source.get(key)));
    return base;
  }


  get data(): mapCollection {
    if (!this.map) {
      return this.selected.clone();
    }
    return this.selected.clone().map((item, key) => {
      const record = this.table.recordForKey(key);
      return this.map? this.map(record, this) : item;
    } );
  }


  private reducer?: dataSetReducerFn;

  private _value: any;

  get value() {
    if (this._value) {
      return this._value;
    }
    if (this.reducer) {
      return this.reducer(this.data, this);
    }
    return this.data;
  }

}

export default DataSet;
