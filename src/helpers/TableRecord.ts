import { enums, create } from '@wonderlandlabs/collect';
import {
  contextObj,
  tableRecordObj
} from "../types";

const {FormEnum} = enums;

/**
 * a bundled pointer to a record in a tableName.
 * In some contexts, data is deterministic from the constructor;
 * if not defined, it is read from the table.
 */
export default class TableRecord implements tableRecordObj {
  constructor(context: contextObj, tableName: string, key: any, data? : any) {
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
    const coll = create(this.data);
    if (coll.form === FormEnum.scalar){
      console.warn('attempt to get a field', field,
        'from scalar', this);
      return undefined;
    }
    return coll.get(field);
  }

  get exists() {
    return (this._data !== undefined) || this.table.hasKey(this.key);
  }
}
