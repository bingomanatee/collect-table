import { contextObj, joinConnObj, joinDefObj, queryDef, queryJoinDef, tableRecordJoin, } from "../types";
import { joinFreq } from "../constants";

function isPlural(conn?: joinConnObj) {
  switch (conn?.frequency) {
    case joinFreq.noneOrMore:
      return true;
      break;

    case joinFreq.oneOrMore:
      return true;
      break;

    default:
      return false;
  }
}

/**
 * parses the individual join of a query; a helper class
 */
 export class TableRecordJoin implements tableRecordJoin {
  private query: queryDef;

  constructor(context, joinDef: queryJoinDef, query: queryDef) {
    this.joinDef = joinDef;
    this.query = query;
    this.context = context;

    if (this.joinName) {
       this._fromContext();
    }
    if (this.joinDef.connections) {
       this._fromLocal();
    }
  }

  joinDef: queryJoinDef;

  localConn?: joinConnObj;

  foreignConn?: joinConnObj;

  private context: contextObj;

  //  ----------------- derived fields

  get tableName() {
    return this.query.tableName;
  }

  get foreignIsPlural () {
    return isPlural(this.foreignConn);
  };

  get localIsPlural() {
    return isPlural(this.localConn);
  }

  get joinName() {
    return this.joinDef.joinName;
  }

  get attachKey() {
    if (this.joinDef.as) {
      return this.joinDef.as;
    }
    if (this.joinDef.joinName) {
      return this.joinDef.joinName;
    }
    return '';
  }

  // ----------------- parsers

  /**
   * parses a transiently defined join
   */
  _fromLocal() {
    if (!this.joinDef.connections) throw new Error('_fromLocal requires connections');

    const [fromDef, toDef] = this.joinDef.connections;
    if (fromDef.tableName === this.tableName) {
      this.localConn = fromDef;
      this.foreignConn = toDef;
    } else if (toDef.tableName === this.tableName) {
      this.foreignConn = fromDef;
      this.localConn = toDef;
    }
  }

  _fromContext() {
    if (!this.context.joins.hasKey(this.joinName)) {
      console.error('cannot find ', this.joinName, 'in context', this.context.joins.store);
      throw new Error(`TableRecordJoin._performContextJoin join - bad join name ${  this.joinName}`);
    }
    const def: joinDefObj = this.context.joins.get(this.joinName);
    if (def?.from?.tableName === this.tableName) {
      this.localConn = def.from;
      this.foreignConn = def.to;
    } else if (def?.to?.tableName === this.tableName) {
      this.localConn = def.to;
      this.foreignConn = def.from;
    } else {
      console.warn('fromContext: cannot find tableName', this.tableName, 'in joinDef', def);
    }
  }
}

export default TableRecordJoin;
