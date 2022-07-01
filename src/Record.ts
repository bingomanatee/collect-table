import { enums, create } from '@wonderlandlabs/collect';
import {
  contextObj, mapCollection,
  recordObj, tableRecordValueObj
} from "./types";
import { isCollection } from './typeGuards';

const { FormEnum } = enums;

/**
 * a bundled pointer to a record in a tableName.
 * In some contexts, data is deterministic from the constructor;
 * if not defined (the normal use case) it is read from the table with every call to `.data`.
 */
export default class Record implements recordObj {
  constructor(context: contextObj, tableName: string, key: any, data?: any) {
    this.context = context;
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

  public context: contextObj;

  get table() {
    return this.context.table(this.tableName);
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
    const { coll } = this;
    if (coll.form === FormEnum.scalar) {
      console.warn('attempt to get a field', field,
        'from scalar', this);
      return undefined;
    }
    return coll.get(field);
  }

  private get coll() {
    const { data } = this;
    return !isCollection(data) ? create(data) : data;
  }

  setField(field, value) {
    const { coll } = this;
    if (coll.form === FormEnum.scalar) {
      return;
    }
    if (typeof value === 'function') {
      coll.set(field, value(this.data, this.key));
    }
    coll.set(field, value);
  }

  get exists() {
    return (this._data !== undefined) || this.table.hasKey(this.key);
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
    if (this.notes?.hasKey('joins')) {
      out.joins = this.joinObj;
    }
    return out;
  }

  /**
   * returns joins flattened into an object -- or undefined/
   */
  get joinObj() {
    const joins = this.notes?.get('joins');
    if (!joins) {
      return undefined;
    }
    return joins.reduce((m, records, name) => {
      if (m) {
        // eslint-disable-next-line no-param-reassign
        m[name] = records;
        return m;
      }
      return {[name]: records};
    }, undefined);
  }

  get collection() {
    if (isCollection(this.data)) {
      return this.data;
    }
    return create(this.data);
  }

  get form() {
    return this.collection.form;
  }

  public addJoin(key, items) {
    if (!this.notes) {
      this.notes = create(new Map());
    }
    if (!this.notes.hasKey('joins')) {
      this.notes.set('joins', create(new Map()));
    }
    this.notes.get('joins').set(key, items);
  }
}
