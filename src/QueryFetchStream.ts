import { BehaviorSubject, map, distinctUntilChanged } from "rxjs";
import isEqual from 'lodash.isequal';
import type { collectionObj } from "@wonderlandlabs/collect/types/types";
import { contextObj, queryDef } from "./types";

import DataSet from "./DataSet";

function isCollection(item): item is collectionObj<any, any, any> {
  return (item && (typeof item === 'object')
    && ('store' in item)
    && ('form' in item)
    && ('type' in item)
    && ('items' in item)
    && ('keys' in item)
  )
}

function isDataSet(item): item is DataSet {
  return item instanceof DataSet;
}

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
