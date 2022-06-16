import {contextObj, joinConnObj, joinDefObj} from "./types";
import {joinFreq} from "./constants";

function asConn(def) {
  let out = def;
  if (typeof def === 'string') {
    if (/\./.test(def)) {
      const [table, key] = def.split('.');
      out = {
        table, key
      }
    } else {
      out = {table: def};
    }
  }

  if (! ('frequency' in out)) {
    out.frequency = joinFreq.noneOrOne;
  }
  return out;
}

export default class TableJoin implements joinDefObj{
  context: contextObj;

  from: joinConnObj;

  to: joinConnObj;

  name?: string;

  constructor(context, def, opts?) {
    this.context = context;
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
    }

   this.parseOpts(opts);
  }

  private parseOpts(opts?) {
    if (!opts) return;
    if (typeof opts === 'string') {
      this.name = opts;
    }
    if(opts.name) {
      this.name = opts;
    }
  }
}
