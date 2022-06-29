/* eslint-disable no-use-before-define */
import EventEmitter from 'emitix';
import type { collectionObj } from '@wonderlandlabs/collect';
import { binaryOperator, booleanOperator, changePhases, joinFreq } from "./constants";

// ------------- MICRO DEFS

export type helperMap = Map<queryJoinDef, tableRecordJoinObj>;
export type anyMap = Map<any, any>;
export type stringMap = Map<string, any>;
export type mapCollection = collectionObj<Map<any, any>, any, any>;
export type tableRecordMetaObj = {
  notes?: stringMap;
}
// ------ joinedRecords


export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};

// ---- dataset

export type dataSetSelectorFn = (keys: any[], source: mapCollection, ds: dataSetObj) => any[];
export type dataSetPostFn = (ds: dataSetObj) => any;
export type dataSetReducerFn = (data: mapCollection, ds: dataSetObj) => any;
export type dataSetMapFn = (data: tableRecordObj, ds: dataSetObj) => mapCollection;
export type dataSetParams = {
  context: contextObj,
  sourceTable: string,
  source?: mapCollection,
  keys?: any[],
  reducer?: dataSetReducerFn,
  data?: mapCollection,
  selector?: dataSetSelectorFn,
  map?: dataSetMapFn,
  post?: dataSetPostFn,
  meta?: any,
  value?: any
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
export type addDataMetaObj = {key?: any};
export type contextOptionsObj = {
  joins?: joinDefObj[];
};

export type notesCollectionObj = collectionObj<Map<string, any>, any, string>;

// -------------- functions

export type innerBinaryFn = (recordTerm: any, recordAgainst: any, record: tableRecordObj, term: binaryTestObj) => boolean;
export type dataCreatorFn = (table: tableObj, data: any, key?: any) => any;
export type keyProviderFn = ( target: any, table: tableObj,meta?: any) => any[];

export type recordFn = (tableRecordObj) => any;
export type recordTestFn = (tableRecordObj) => boolean;
export type queryEachFn = (record: tableRecordValueObj, ctx: contextObj, table: tableObj) => any;
export type dataSetAnnotateFn = (key: any, field: string, value: any) => void;
export type dsMutatorFn = (ds: dataSetObj, annotation: any, key?: any) => void;
export type dataSetAnnotateMutatorFn = (ds: dataSetObj, mutator: dsMutatorFn, key?: any) => void;

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
} & queryDef;

export type queryJoinDef = {
  joinName?: string;
  as?: string;
  connections?: joinConnObj[]
} & queryDef;

export type queryDef = {
  tableName: string;
  key?: any;
  where?: whereTerm;
  joins?: queryJoinDef[];
}

// -------------- CORE OBJECTS

export type dataSetObj = {
  context: contextObj;
  source: mapCollection;
  keys: any[];
  selected: mapCollection;
  data: mapCollection;
  value: mapCollection;
  tableName: string;
  annotate: dataSetAnnotateFn;
  mutateAnnotation: dataSetAnnotateMutatorFn;
}

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
  query: (query: queryDef) => dataSetObj;
  queryItems: (query: queryDef) => any[];
  activeChanges: collectionObj<changeObj[],number,changeObj>;
  stream: (query: queryDef, listener) => any;
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
  query: (query: queryDef) => dataSetObj;
  queryEach: (query: queryDef, action: queryEachFn) => void;
  setMany: (keys, field, value) => void;
  stream: (query: queryDef, listener) => any;
} & EventEmitter;

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

export type trvNotesObj = {[key: string] : any};

export type tableRecordValueObj = {
  tableName: any,
  key: any,
  data: any,
  notes?: trvNotesObj;
}
export type tableRecordObj = {
  data: any;
  collection: collectionObj<any,any,any>;
  tableName: string;
  key: any;
  table: tableObj;
  context: contextObj;
  get: (field: any) => any;
  set: (field: any, value: any) => void;
  exists: boolean;
  notes?: anyMap;
  addNotes: (map: stringMap) => void;
  value: tableRecordValueObj;
}
