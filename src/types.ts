import EventEmitter from 'emitix';
import type { collectionObj } from '@wonderlandlabs/collect';
import { changePhases, joinFreq } from "./constants";

// ------------- MICRO DEFS

export type anyMap = Map<any, any>;
export type mapCollection = collectionObj<Map<any, any>, any, any>;

// ------ joins

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

export type tableOptionsObj = {
  keyProvider?: keyProviderFn;
  recordCreator?: recordCreatorFn;
  data?: any[];
};

export type tableDefObj = {
  name: string;
  data?: any[];
  options?: tableOptionsObj;
};

export type contextOptionsObj = {
  joins?: joinDefObj[];
};

// -------------- functions

export type recordCreatorFn = (table: tableObj, data: any, key?: any) => any;
export type keyProviderFn = (table: tableObj, target: any, meta?: any) => any;
export type joinFn = (item, table: tableDefObj, args?: any) => any;

// --- query

export type queryJoinDef = {
  joinName?: string;
  join: joinFn;
  table?: string;
  where?: string;
  as?: string;
  args? : any[];
}

export type queryDef = {
  table: string;
  where?: (item: any, key: any, table: tableObj) => boolean;
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
  query: (query: queryDef) => any;
} & EventEmitter;

export type tableObj = {
  name: string;
  data: mapCollection;
  addMany: (records: any[]) => any[];
  hasRecord: (key: any) => boolean;
  addRecord: (data: any, meta?: any) => any; // returns key
  getRecord: (key: any) => any | undefined;
  context: contextObj;
  restore: (store: Map<any, any>) => tableObj;
  query: (query: queryDef) => any
} & EventEmitter;

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
