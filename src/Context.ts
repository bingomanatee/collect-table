import create from '@wonderlandlabs/collect';
import EventEmitter from 'emitix';
import { Change } from './Change';
import {
  changeObj,
  contextObj,
  contextOptionsObj,
  joinDefObj,
  tableDefObj,
  tableOptionsObj,
} from './types';
import { CollectionTable } from './CollectionTable';

class TableJoin implements joinDefObj {
  private context: contextObj;
  private key: string;
  constructor(context: contextObj, def: joinDefObj, key: string) {
    this.name = def?.name || '';
    this.key = key;
    this.context = context;
    this.source = def.source;
    this.dest = def.dest;
    this.sourceField = def?.sourceField || '';
    this.destField = def?.destField || '';
    if (def.joinTable) {
      this.joinTable = def.joinTable;
      this.joinSourceField = def?.joinSourceField || '';
      this.joinDestField = def?.joinDestField || '';
    }
  }

  name: string; // this is the field in which the joined records are returned.
  // by convention it is capitalized to discriminate between it and general fields.

  source: string; // name of the table joined "from".
  // in joining, "from/to" are relative, arbitrary.
  sourceField: string; // if empty, assume it is the key

  dest: string; // name of the table joined "to". .
  destField: string; // if empty, assume it is the key

  joinDestField = ''; // name of the source field as kept in the join table;
  // if empty, is the same as the table name
  joinSourceField = ''; // name of the dest field as kept in the join table;
  // if empty, is the same as the table name
  joinTable = ''; // if empty, there is no table name-- uses foreign keys
}

export default class Context extends EventEmitter implements contextObj {
  protected transactions = create([]);
  protected time = 0;
  protected tables = create(new Map([]));
  protected joins = create(new Map([]));

  constructor(tables?: tableDefObj[], options?: contextOptionsObj) {
    super();
    if (tables) {
      tables.forEach(def => this.addTable(def));
    }
    if (options) this.addOptions(options);
  }

  addOptions(options?: contextOptionsObj) {
    if (Array.isArray(options?.joins)) {
      options.joins.forEach((join: joinDefObj) => this.addJoin(join));
    }
  }

  addJoin(def: joinDefObj) {
    const index = def.name || `join_${this.joins.size}`;
    this.joins.set(index, new TableJoin(this, def, index));
  }

  transact(fn) {
    const change = new Change(this);
    this.transactions.store.push(change);
    change.start();
    try {
      fn(change);
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
    }
  }

  /**
   * gets or generates a new TableCollection of a given name
   * @param name
   * @param data
   * @param options
   */
  table(name, data?: any[], options?: tableOptionsObj) {
    if (!this.tables.hasKey(name)) {
      this.tables.set(name, new CollectionTable(this, name, data, options));
    }
    return this.tables.get(name);
  }

  get lastChange(): changeObj | undefined {
    return this.transactions.reduce(
      (memo: changeObj | undefined, trans: changeObj) => {
        if (!memo) return trans;
        if (memo && memo.time > trans.time) {
          return memo;
        }
        return trans;
      }
    );
    return undefined;
  }

  get now() {
    return this.time;
  }

  get next() {
    ++this.time;
    return this.time;
  }
}
