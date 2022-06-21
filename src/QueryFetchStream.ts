import { BehaviorSubject, filter } from "rxjs";
import { contextObj, queryDef } from "./types";

function listen(context, query) {
  const subject = new BehaviorSubject(context);

  const response = subject.pipe(filter((currentContext) => currentContext.query(query)));

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
