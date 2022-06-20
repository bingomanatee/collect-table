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
declare enum joinFreq {
    noneOrOne = "noneOrOne",
    one = "one",
    noneOrMore = "noneOrMore",
    oneOrMore = "oneOrMore"
}
declare enum tableRecordState {
    new = 0,
    saved = 1,
    deleted = 2
}

declare type anyMap = Map<any, any>;
declare type stringMap = Map<string, any>;
declare type mapCollection = collectionObj<Map<any, any>, any, any>;
declare type tableRecordMetaObj = {
    state?: tableRecordState;
    data?: any;
    start?: any;
    joins?: stringMap;
};
declare type joinConnObj = {
    table: string;
    key?: string;
    joinTableKey?: string;
    frequency?: joinFreq;
};
declare type joinDefObj = {
    name?: string;
    from: joinConnObj;
    to: joinConnObj;
};
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
declare type addDataMetaObj = {
    key?: any;
};
declare type contextOptionsObj = {
    joins?: joinDefObj[];
};
declare type recordCreatorFn = (table: tableObj, data: any, key?: any) => any;
declare type keyProviderFn = (table: tableObj, target: any, meta?: any) => any;
declare type joinFn = (item: any, table: tableDefObj, args?: any) => any;
declare type queryJoinDef = {
    joinName?: string;
    join: joinFn;
    table?: string;
    where?: string;
    as?: string;
    args?: any[];
};
declare type queryDef = {
    table: string;
    where?: (item: any, key: any, table: tableObj) => boolean;
    joins?: Map<string, queryJoinDef>;
};
declare type contextObj = {
    transact: (fn: (changesObj: any) => any) => any;
    now: number;
    next: number;
    hasTable: (name: string) => boolean;
    table: (name: string, options?: tableOptionsObj) => tableObj;
    lastChange: changeObj | undefined;
    restoreTable(name: string, table: mapCollection): any;
    joins: collectionObj<Map<string, joinDefObj>, string, joinDefObj>;
    query: (query: queryDef) => any;
} & EventEmitter;
declare type tableObj = {
    name: string;
    data: mapCollection;
    addMany: (records: any[]) => any[];
    hasKey: (key: any) => boolean;
    addData: (data: any, meta?: any) => any;
    getData: (key: any) => any | undefined;
    context: contextObj;
    restore: (store: Map<any, any>) => tableObj;
    query: (query: queryDef) => any;
} & EventEmitter;
declare type dataContextObj = {
    name: string;
    context: contextObj;
};
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
declare type tableRecordObj = {
    state?: tableRecordState;
    data: any;
    joins: stringMap;
    tableName: string;
    table: tableObj;
    context: contextObj;
    readonly value: any;
};

export { addDataMetaObj, anyMap, changeObj, contextObj, contextOptionsObj, dataContextObj, joinConnObj, joinDefObj, joinFn, keyProviderFn, mapCollection, queryDef, queryJoinDef, recordCreatorFn, stringMap, tableDefObj, tableObj, tableOptionsObj, tableRecordMetaObj, tableRecordObj };
