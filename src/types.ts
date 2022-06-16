import EventEmitter from 'emitix';
import type { collectionObj } from '@wonderlandlabs/collect';
import { changePhases, joinFreq, tableChangeTypeEnum } from "./constants";

export type contextObj = {
  transact: (fn: (changesObj) => any) => any;
  now: number;
  next: number;
  hasTable: (name: string) => boolean;
  table: (name: string, options?: tableOptionsObj) => tableObj;
  // eslint-disable-next-line no-use-before-define
  lastChange: changeObj | undefined;
  restoreTable(name: string, table: mapCollection);
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

export type anyMap = Map<any, any>;
export type tableItemChange = {
  key: any;
  old?: any;
  now?: any;
  type: tableChangeTypeEnum;
};
export type completeUpdate = {
  oldTable?: anyMap[];
  newTable: anyMap;
  completeUpdate: boolean;
};
export type changeSet = tableItemChange[] | completeUpdate;
export type mapCollection = collectionObj<Map<any, any>, any, any>;
export type tableObj = {
  name: string;
  collection: mapCollection;
  addMany: (records: any[]) => any[];
  hasRecord: (key: any) => boolean;
  addRecord: (data: any, meta?: any) => any; // returns key
  getRecord: (key: any) => any | undefined;
  context: contextObj;
  restore: (store: Map<any, any>) => tableObj;
} & EventEmitter;
export type recordCreatorFn = (table: tableObj, data: any, key?: any) => any;
export type keyProviderFn = (table: tableObj, target: any, meta: any) => any;

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

export type joinConnObj = {
  table: string;
  key?: string;
  joinTableKey?: string;
  frequency?: joinFreq;
};

export type joinOptsObj = {
  name?: string;
};

export type joinDefObj = {
  name?: string;
  from: joinConnObj;
  to: joinConnObj;
};

export type contextOptionsObj = {
  joins?: joinDefObj[];
};

