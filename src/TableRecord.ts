import { tableObj } from './types';
import { tableRecordState } from './CollectionTable';

export class TableRecord {
  key: any;
  data: any;
  table: tableObj;
  state: tableRecordState;

  constructor(table: tableObj, key: any, data?: any) {
    this.key = key;
    this.data = data;
    this.table = table;
    this.state = tableRecordState.new;
  }

  get context() {
    return this.table.context;
  }
}
