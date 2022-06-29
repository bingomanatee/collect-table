import { enums, create } from '@wonderlandlabs/collect';
import {
  contextObj,
  tableRecordObj, tableRecordValueObj
} from "../types";
import { isCollection } from '../typeGuards';

const { FormEnum } = enums;

/**
 * a bundled pointer to a record in a tableName.
 * In some contexts, data is deterministic from the constructor;
 * if not defined (the normal use case) it is read from the table with every call to `.data`.
 */
export default class TableRecord implements tableRecordObj {
  constructor(context: contextObj, tableName: string, key: any, data?: any) {
    this.context = context;
    this.key = key;
    this.tableName = tableName;
    if (data !== undefined) {
      this._data = data;
    }
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
    const {coll} = this;
    if (coll.form === FormEnum.scalar) {
      console.warn('attempt to get a field', field,
        'from scalar', this);
      return undefined;
    }
    return coll.get(field);
  }

  private get coll() {
    const {data} = this;
    return !isCollection(data) ?  create(data) : data;
  }

  set(field, value) {
    const {coll} = this;
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
    return {
      tableName: this.tableName,
      key: this.key,
      data: this.data
    }
  }
}
