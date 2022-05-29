import EventEmitter from 'emitix';
import { types } from '@wonderlandlabs/collect';

export enum changePhases {
  new,
  started,
  executed,
  validated,
  complete,
  failed,
}

export type changeObj = {
  time: number;
  context: contextObj;
  phase: changePhases;
  error?: any;
  isFailed: boolean;
  isActive: boolean;
  isLive: boolean;
};

export type contextObj = {
  transact: (fn: (changesObj) => any) => void;
  now: number;
  next: number;
  lastChange: changeObj | undefined;
} & EventEmitter;

export enum tableChangeTypeEnum {
  added,
  updated,
  deleted,
}

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
export type mapCollection = types.collectionObj<Map<any, any>, any, any>;
export type recordCreatorFn = (data: any, identity?: any) => any;
type keyProviderFn = (target: any, meta: any) => any;

export type tableOptionsObj = {
  keyProvider?: keyProviderFn;
  recordCreator?: recordCreatorFn;
};
export type tableObj = {
  addMany: (records: any[]) => any[];
  addRecord: (data: any, meta?: any) => any; // returns key
  getRecord: (key: any) => any | undefined;
  context: contextObj;
};

export type tableDefObj = {
  name: string;
  data?: any[];
  options?: tableOptionsObj;
};

export enum joinOrder {
  noneOrOne,
  one,
  noneOrMore,
  oneOrMore,
}

export type joinDefObj = {
  name?: string;

  source: string;
  sourceField?: string;
  sourceCount: joinOrder;

  dest: string;
  destField?: string;
  destOrder: joinOrder;

  joinTable?: string;
  joinSourceField?: string;
  joinDestField?: string;
};

export type contextOptionsObj = {
  joins?: joinDefObj[];
};
