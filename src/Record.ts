import { enums, create } from '@wonderlandlabs/collect';
import { collectionObj } from "@wonderlandlabs/collect/types/types";
import {
  baseObj, mapCollection,
  recordObj, tableRecordValueObj
} from "./types";
import { isCollection, isTableRecord } from './typeGuards';

const { FormEnum } = enums;

/**
 * a bundled pointer to a record in a tableName.
 * In some bases, data is deterministic from the constructor;
 * if not defined (the normal use case) it is read from the table with every call to `.data`.
 */
export default class Record implements recordObj {
  constructor(base: baseObj, tableName: string, key: any, data?: any) {
    this.base = base;
    this.key = key;
    this.tableName = tableName;
    if (data !== undefined) {
      this._data = data;
    }
  }

  public notes?: mapCollection;

  public setNote(key, value) {
    if (!this.notes) {
      this.notes = create(new Map());
    }
    this.notes.set(key, value);
  }

  protected get noteObj() {
    if (!this.notes) {
      return undefined;
    }
    return this.notes.reduce((meta, item, key) => {
      // eslint-disable-next-line no-param-reassign
      meta[key] = item;
      return meta;
    }, {})
  }

  public key: any;

  public tableName: string;

  public base: baseObj;

  get table() {
    return this.base.table(this.tableName);
  }

  protected _data;

  get data() {
    if (this._data) {
      return this._data;
    }
    return this.table.getData(this.key);
  }

  get(field): any {
    if (!this.exists) {
      return undefined;
    }
    if (this.form === FormEnum.scalar) {
      console.warn('attempt to get a field', field,
        'from scalar', this);
      return undefined;
    }
    return this.collection.get(field);
  }

  setField(field, value) {
    if (this.form === FormEnum.scalar) {
      return;
    }
    if (typeof value === 'function') {
      this.collection.set(field, value(this.data, this.key));
    } else {
      this.collection(field, value);
    }
  }

  get exists() {
    return this.table.hasKey(this.key);
  }

  /**
   * a JSON of this item.
   */
  get value(): tableRecordValueObj {

    const out: tableRecordValueObj = {
      tableName: this.tableName,
      key: this.key,
      data: this.data,
    }
    if (this._joins) {
      out.joins = this.joinObj;
    }
    return out;
  }

  _joins?: mapCollection;

  /**
   * returns joins flattened into an object -- or undefined/
   */
  protected get joinObj() {
    const joins = this._joins;
    if (!joins) {
      return undefined;
    }
    return joins.reduce((m, records, name) => {
      let joinValues = records;
      if (isTableRecord(joinValues)) {
        joinValues = records.value;
      } else if (Array.isArray(joinValues)) {
        joinValues = joinValues.map((r) => {
          if (isTableRecord(r)) {
            return r.value;
          }
          return r;
        })
      }
      if (m) {
        // eslint-disable-next-line no-param-reassign
        m[name] = joinValues;
        return m;
      }
      return { [name]: joinValues };
    }, undefined);
  }

  private _collection?: collectionObj<any, any, any>

  get collection() {
    if (isCollection(this.data)) {
      return this.data;
    }
    if (!this._collection || this._collection.store !== this.data) {
      this._collection = create(this.data);
    }
    return this._collection;
  }

  get form() {
    return this.collection.form;
  }

  /**
   * adds a joined definition to the "meta.join" map.
   * @param key the name of the join -- or the "as" field of the connection
   * @param items one/several related records
   */
  public addJoin(key: any, items: recordObj | recordObj[] | null) {
    if (!this._joins) {
      this._joins = create(new Map());
    }

    this._joins.set(key, items);
  }

  delete() {
    this.table.removeKey(this.key);
  }
}
