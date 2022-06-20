import type { reduceAction } from '@wonderlandlabs/collect';
import { contextObj } from './types';
import { tableRecordState } from "./constants";

export default class TableRecord {
  key?: any;

  reducer?: reduceAction;

  reducerStart?: any;

  tableName: string;

  context: contextObj;

  state: tableRecordState;

  meta?: any;

  constructor({ name, table, context }, keyOrReducer, meta?) {
    if (typeof keyOrReducer === 'function') {
      this.reducer = keyOrReducer;
    } else {
      this.key = keyOrReducer;
    }
    this.tableName = name || table;
    this.context = context
    this.meta = meta;
    if ((typeof meta === 'object') && ('state' in meta)) {
      this.state = meta.state;
    } else {
      this.state = tableRecordState.new;
    }
    if (typeof meta === 'function') {
      this.reducerStart = meta;
    } else if (typeof meta === 'object' && ('start' in meta)) {
      this.reducerStart = meta.start;
    }
  }

  get table() {
    return this.context.table(this.table);
  }

  get data () {
    if (this.reducer) {
      if (typeof this.reducerStart === 'function') {
        return this.table.data.reduce(this.reducer, this.reducerStart(this));
      }
      return this.table.data.reduce(this.reducer, this.reducerStart);
    }
      return this.table.getData(this.key);
  }
}
