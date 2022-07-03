import { BehaviorSubject, distinctUntilChanged } from "rxjs";
import isEqual from 'lodash.isequal';
import { baseObj, queryDef } from "../types";

function listen(qfs: QueryFetchStream) {
  const { query, base } = qfs;
  const subject = new BehaviorSubject(base.query(query));

  const response = subject.pipe(
    distinctUntilChanged(isEqual)
  );

  base.on('change-complete', (change) => {
    if (base.activeChanges.size === 1 && base.lastChange?.time === change.time) {
      subject.next(base.query(query));
    }
  });

  return response;
}

export class QueryFetchStream {
  constructor(base, query) {
    this.base = base;
    this.query = query;
  }

  base: baseObj;

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
    return this.base.query(this.subject);
  }

}

export default QueryFetchStream;
