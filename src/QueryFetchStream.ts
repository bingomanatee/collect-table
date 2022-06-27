import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import isEqual from 'lodash.isequal';
import { contextObj, queryDef } from "./types";
import { isCollection, isDataSet } from "./typeGuards";

function queryValueOf(q) {
  if (isDataSet(q)) {
    return queryValueOf(q.value);
  }
  if (isCollection(q)) {
    return q.map(queryValueOf).store;
  }
  return q;
}

function listen(qfs: QueryFetchStream) {
  const { query, context } = qfs;
  const subject = new BehaviorSubject(context.query(query));

  const response = subject.pipe(
    map(queryValueOf),
    distinctUntilChanged(isEqual)
  );

  context.on('change-complete', (change) => {
    if (context.activeChanges.size === 1 && context.lastChange?.time === change.time) {
      subject.next(context.query(query));
    }
  });

  return response;
}

export class QueryFetchStream {
  constructor(context, query) {
    this.context = context;
    this.query = query;
  }

  context: contextObj;

  query: queryDef;

  private _subject: any;

  get subject(): any {
    if (!this._subject) {
      this._subject = listen(this);
    }
    return this._subject;
  }

  subscribe(listener) {
    return this.subject.subscribe(listener);
  }

  get current() {
    return this.context.query(this.subject);
  }

}

export default QueryFetchStream;
