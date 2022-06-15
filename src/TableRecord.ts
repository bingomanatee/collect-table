import { tableObj } from './types';
import { tableRecordState } from "./constants";

export class TableRecord {
  key: any;

  data: any;

  table: tableObj;

  state: tableRecordState;

  meta?: any;

  constructor(table: tableObj,    data: any, key: any, meta?: any) {
    this.key = key;
    this.data = data;
    this.table = table;
    this.meta = meta;
    this.state = tableRecordState.new;
    if ((typeof meta === 'object') && ('state' in meta))  {
      this.state = meta.state;
    }
  }

  get context() {
    return this.table.context;
  }
}
