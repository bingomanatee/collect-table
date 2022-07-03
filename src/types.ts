/* eslint-disable no-use-before-define */
import EventEmitter from 'emitix';
import { collectionObj } from '@wonderlandlabs/collect';
import { binaryOperator, booleanOperator, changePhases, joinFreq } from "./constants";

// ------------- MICRO DEFS

export type helperMap = Map<queryJoinDef, tableRecordJoin>;
export type anyMap = Map<any, any>;
export type stringMap = Map<string, any>;
export type mapCollection = collectionObj<anyMap, any, any>;
export type tableRecordNotesColl = collectionObj<stringMap, string, any>;
export type recordSetMap = Map<any, recordObj>;
export type recordSetCollection = collectionObj<recordSetMap, any, recordObj>;
export type tableRecordMetaObj = {
  helpers?: helperMap;
  joins?: stringMap;
}
// ------ joins

export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};

export type tableRecordJoin = {
  joinDef: queryJoinDef;
  foreignConn?: joinConnObj;
  localConn?: joinConnObj;
  joinName?: string;
  localIsPlural: boolean;
  foreignIsPlural: boolean;
  attachKey: string;
  tableName: string;
}
// ----- parameter defs

export type tableOptionsObj = {
  keyProvider?: keyProviderFn;
  key?: any;
  recordCreator?: dataCreatorFn;
  data?: any[];
};
export type tableDefObj = {
  name: string;
  data?: any[];
  options?: tableOptionsObj;
};
export type addDataMetaObj = { key?: any };
export type baseOptsObj = {
  joins?: joinDefObj[];
};
export type stringObj = { [key: string]: any };

// -------------- functions

export type innerBinaryFn = (recordTerm: any, recordAgainst: any, record: recordObj, term: binaryTestObj) => boolean;
export type dataCreatorFn = (table: tableObj, data: any, key?: any) => any;
export type keyProviderFn = (target: any, table: tableObj, meta?: any) => any[];

export type recordFn = (tableRecordObj) => any;
export type recordTestFn = (tableRecordObj) => boolean;
export type queryEachFn = (record: tableRecordValueObj, ctx: baseObj, table: tableObj) => any;

// --- query : where

export type whereTerm = recordTestFn | binaryTestObj | whereUnionObj;

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

type binaryTestObjBase = {
  termFn?: recordFn;
  field?: string;
  test: binaryOperator;
  against?: any;
  againstFn?: recordFn;
};

type binaryTestObjB2 = RequireAtLeastOne<binaryTestObjBase, 'termFn' | 'field'>;
export type binaryTestObj = RequireAtLeastOne<binaryTestObjB2, 'against' | 'againstFn'>;

export type whereUnionObj = {
  tests: whereTerm[];
  bool: booleanOperator;
};

// ----- query

// this defines one "end" of a join - a pointer to the target, or the source.
export type joinConnObj = {
  frequency?: joinFreq;
  as?: string;
  tableName: string;
  key?: any;
  joinTableField: string;
}

export type queryClauses = {
  where?: whereTerm;
  joins?: queryJoinDef[];
}

export type queryJoinDef = {
  joinName?: string;
  as?: string;
  connections?: joinConnObj[];
  joinTableName?: string;
} & queryClauses;

export type queryDef = {
  tableName: string;
  key?: any;
  keys?: any[];
} & queryClauses;

// -------------- CORE OBJECTS

export type baseObj = {
  transact: (fn: (changesObj) => any) => any;
  now: number;
  next: number;
  hasTable: (name: string) => boolean;
  table: (name: string, options?: tableOptionsObj) => tableObj;
  // eslint-disable-next-line no-use-before-define
  lastChange: changeObj | undefined;
  restoreTable(name: string, table: mapCollection);
  joins: collectionObj<Map<string, joinDefObj>, string, joinDefObj>;
  query: (query: queryDef) => recordObj[];
  queryItems: (query: queryDef) => any[];
  activeChanges: collectionObj<changeObj[], number, changeObj>;
  stream: (query: queryDef, listener) => any;
} & EventEmitter;

export type tableObj = {
  name: string;
  data: mapCollection;
  addMany: (records: any[]) => any[];
  hasKey: (key: any) => boolean;
  addData: (data: any, meta?: any) => any; // returns key
  getData: (key: any) => any | undefined;
  recordForKey: (key: any, meta?: tableRecordMetaObj) => recordObj;
  base: baseObj;
  restore: (store: anyMap) => tableObj;
  query: (query: queryDef) => recordObj[];
  queryEach: (query: queryDef, action: queryEachFn) => void;
  setMany: (keys, field, value) => void;
  stream: (query: queryDef, listener) => any;
  removeKey: (key: any) => void;
  removeItem: (item: any) => void;
  removeQuery: (query: stringObj) => void;
  join: (keyMap: anyMap , joinName: string) =>void;
} & EventEmitter;

export type changeObj = {
  time: number;
  base: baseObj;
  backupTables: mapCollection;
  saveTableBackup: (tableName: string, store: Map<any, any>) => void;
  phase: changePhases;
  error?: any;
  isFailed: boolean;
  isActive: boolean;
  isLive: boolean;
};

export type tableRecordValueObj = {
  tableName: any,
  key: any,
  data: any,
  joins?: { [joinName: string]: recordObj[] };
}
export type recordObj = {
  data: any;
  tableName: string;
  key: any;
  table: tableObj;
  base: baseObj;
  get: (field: any) => any;
  setField: (field: any, value: any) => void;
  exists: boolean;
  value: tableRecordValueObj;
  notes?: tableRecordNotesColl;
  addJoin: (key: any, item: any) => void;
  setNote: (field: any, value: any) => void;
  readonly form: string;
}
