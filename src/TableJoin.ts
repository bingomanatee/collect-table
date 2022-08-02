import { baseObj, joinConnObj, joinDefObj } from './types';

function asConn (def) {
  let out = def;
  if (typeof def === 'string') {
    if (/\./.test(def)) {
      const [table, key] = def.split('.');
      out = {
        table, key
      };
    } else {
      out = { table: def };
    }
  }

  return out;
}

export default class TableJoin implements joinDefObj {
  base: baseObj;

  from: joinConnObj;

  to: joinConnObj;

  name?: string;

  joinTableName?: string;

  constructor (base, def, opts?) {
    this.base = base;
    if (Array.isArray(def)) {
      const [fromTable, toTable] = def;
      this.from = asConn(fromTable);
      this.to = asConn(toTable);
    } else {
      const {
        from: fromTable,
        to: toTable
      } = def;
      this.from = asConn(fromTable);
      this.to = asConn(toTable);
      this.joinTableName = def.joinTableName;
      this.name = def.name;
    }

    this.parseOpts(opts);
  }

  private parseOpts (opts?) {
    if (!opts) return;
    if (typeof opts === 'string') {
      this.name = opts;
    }
    if (opts.name) {
      this.name = opts;
    }
  }
}
