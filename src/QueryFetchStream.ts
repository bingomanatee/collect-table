import { BehaviorSubject, map, distinctUntilChanged } from "rxjs";
import isEqual from 'lodash.isequal';
import { contextObj, queryDef } from "./types";
import TableRecord from "./helpers/TableRecord";

function queryValueOf(q) {
  if (q instanceof TableRecord) {
    return q.data;
  }
  if (Array.isArray(q)) {
    return q.map(queryValueOf);
  }
  return q;
}

function listen(context, query) {
  const subject = new BehaviorSubject(context);

  const response = subject.pipe(
    map((currentContext) => currentContext.query(query)),
    map(queryValueOf),
    distinctUntilChanged(isEqual)
  );

  context.on('change-complete', (change) => {
    if (!(context.activeChanges.size ===1 && context.lastChange === change)) {
      subject.next(context);
    }
  });

  return response;
}

export default class QueryFetchStream {
  constructor(context, query) {
    this.context = context;
    this.query = query;
  }

  private context: contextObj;

  private query: queryDef;

  private _subject: any;

  get subject(): any {
    if (!this._subject) {
      this._subject = listen(this.context, this.query);
    }
    return this._subject;
  }

  subscribe(listener) {
    return this._subject.subscribe(listener);
  }

  get current() {
    return this.context.query(this.subject);
  }

}
