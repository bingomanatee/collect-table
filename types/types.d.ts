import EventEmitter from 'emitix';
import { collectionObj } from '@wonderlandlabs/collect';

declare enum changePhases {
    new = 0,
    started = 1,
    executed = 2,
    validated = 3,
    complete = 4,
    failed = 5
}
declare enum tableChangeTypeEnum {
    added = 0,
    updated = 1,
    deleted = 2
}
declare enum joinFreq {
    noneOrOne = 0,
    one = 1,
    noneOrMore = 2,
    oneOrMore = 3
}

declare type contextObj = {
    transact: (fn: (changesObj: any) => any) => void;
    now: number;
    next: number;
    table: (name: string, options?: tableOptionsObj) => tableObj;
    lastChange: changeObj | undefined;
    restoreTable(name: string, table: mapCollection): any;
} & EventEmitter;
declare type changeObj = {
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
declare type anyMap = Map<any, any>;
declare type tableItemChange = {
    key: any;
    old?: any;
    now?: any;
    type: tableChangeTypeEnum;
};
declare type completeUpdate = {
    oldTable?: anyMap[];
    newTable: anyMap;
    completeUpdate: boolean;
};
declare type changeSet = tableItemChange[] | completeUpdate;
declare type mapCollection = collectionObj<Map<any, any>, any, any>;
declare type tableObj = {
    name: string;
    collection: mapCollection;
    addMany: (records: any[]) => any[];
    hasRecord: (key: any) => boolean;
    addRecord: (data: any, meta?: any) => any;
    getRecord: (key: any) => any | undefined;
    context: contextObj;
    restore: (store: Map<any, any>) => tableObj;
};
declare type recordCreatorFn = (table: tableObj, data: any, key?: any) => any;
declare type keyProviderFn = (table: tableObj, target: any, meta: any) => any;
declare type tableOptionsObj = {
    keyProvider?: keyProviderFn;
    recordCreator?: recordCreatorFn;
    data?: any[];
};
declare type tableDefObj = {
    name: string;
    data?: any[];
    options?: tableOptionsObj;
};
declare type joinConnObj = {
    table: string;
    key?: string;
    joinTableKey?: string;
    frequency?: joinFreq;
};
declare type joinOptsObj = {
    name?: string;
    joinTableName: string;
};
declare type joinDefObj = {
    name?: string;
    joinTable?: string;
    connections: Array<joinConnObj>;
};
declare type contextOptionsObj = {
    joins?: joinDefObj[];
};

export { anyMap, changeObj, changeSet, completeUpdate, contextObj, contextOptionsObj, joinConnObj, joinDefObj, joinOptsObj, keyProviderFn, mapCollection, recordCreatorFn, tableDefObj, tableItemChange, tableObj, tableOptionsObj };
