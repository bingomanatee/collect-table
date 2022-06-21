/* eslint-disable no-use-before-define */
import EventEmitter from 'emitix';
import type { collectionObj } from '@wonderlandlabs/collect';
import { changePhases, joinFreq } from "./constants";

// ------------- MICRO DEFS

export type helperMap = Map<queryJoinDef, tableRecordJoinObj>;
export type anyMap = Map<any, any>;
export type stringMap = Map<string, any>;
export type mapCollection = collectionObj<Map<any, any>, any, any>;
export type tableRecordMetaObj = {
  helpers?: helperMap;
  joins?: stringMap;
}
export type queryCollection = collectionObj<anyMap, any, tableRecordObj>;
// ------ joinedRecords

// this defines one "end" of a join - a pointer to the target, or the source.
export type joinConnObj = {
  table: string;
  key?: string;
  joinTableKey?: string;
  frequency?: joinFreq;
};


export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};

// ----- parameter defs

export type joinResult = tableRecordObj | tableRecordObj[] | undefined;
export type tableOptionsObj = {
  keyProvider?: keyProviderFn;
  key?: any;
  recordCreator?: recordCreatorFn;
  data?: any[];
};
export type tableDefObj = {
  name: string;
  data?: any[];
  options?: tableOptionsObj;
};
export type addDataMetaObj = {key?: any};
export type contextOptionsObj = {
  joins?: joinDefObj[];
};

// -------------- functions

export type recordCreatorFn = (table: tableObj, data: any, key?: any) => any;
export type keyProviderFn = ( target: any, table: tableObj,meta?: any) => any;
export type joinFn = (record: tableRecordObj,  args?: any) => any;

// --- query

export type queryJoinDef = {
  joinName?: string;
  as?: string;
  connections?: joinConnObj[]
} & queryDef;

export type whereObj = {
  field?: string;
  test: string | ((tableRecordObj) => boolean);
  against?: any;
}

export type queryDef = {
  table: string;
  key?: any;
  where?: whereObj;
  joins?: Map<string, queryJoinDef>;
}

// -------------- CORE OBJECTS

export type contextObj = {
  transact: (fn: (changesObj) => any) => any;
  now: number;
  next: number;
  hasTable: (name: string) => boolean;
  table: (name: string, options?: tableOptionsObj) => tableObj;
  // eslint-disable-next-line no-use-before-define
  lastChange: changeObj | undefined;
  restoreTable(name: string, table: mapCollection);
  joins: collectionObj<Map<string, joinDefObj>, string, joinDefObj>;
  query: (query: queryDef) => queryCollection;
  queryItems: (query: queryDef) => any[];
  activeChanges: collectionObj<changeObj[],number,changeObj>;
} & EventEmitter;

export type tableObj = {
  name: string;
  data: mapCollection;
  addMany: (records: any[]) => any[];
  hasKey: (key: any) => boolean;
  addData: (data: any, meta?: any) => any; // returns key
  getData: (key: any) => any | undefined;
  recordForKey: (key: any, meta?: tableRecordMetaObj) => tableRecordObj;
  context: contextObj;
  restore: (store: anyMap) => tableObj;
  query: (query: queryDef) => queryCollection;
} & EventEmitter;

export type dataContextObj = {
  name: string,
  context: contextObj,
}

export type tableRecordJoinObj = {
  updateJoinedRecord: (tableRecordObj) => void;
  joinName: string;
  attachKey: string;
}

export type changeObj = {
  time: number;
  context: contextObj;
  backupTables: mapCollection;
  saveTableBackup: (tableName: string, store: Map<any, any>) => void;
  phase: changePhases;
  error?: any;
  isFailed: boolean;
  isActive: boolean;
  isLive: boolean;
};

export type tableRecordObj = {
  data: any;
  tableName: string;
  key?: any;
  joinedRecords: Map<any, joinResult | undefined>;
  table: tableObj;
  context: contextObj;
  readonly value: any; // data merged with joinedRecords;
}
