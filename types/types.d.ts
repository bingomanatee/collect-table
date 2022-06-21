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

declare type helperMap = Map<queryJoinDef, tableRecordJoinObj>;
declare type anyMap = Map<any, any>;
declare type stringMap = Map<string, any>;
declare type mapCollection = collectionObj<Map<any, any>, any, any>;
declare type tableRecordMetaObj = {
    helpers?: helperMap;
    joins?: stringMap;
};
declare type queryCollection = collectionObj<anyMap, any, tableRecordObj>;
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
declare type joinResult = tableRecordObj | tableRecordObj[] | undefined;
declare type tableOptionsObj = {
    keyProvider?: keyProviderFn;
    key?: any;
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
declare type keyProviderFn = (target: any, table: tableObj, meta?: any) => any;
declare type joinFn = (record: tableRecordObj, args?: any) => any;
declare type queryJoinDef = {
    joinName?: string;
    as?: string;
    connections?: joinConnObj[];
} & queryDef;
declare type whereObj = {
    field?: string;
    test: string | ((tableRecordObj: any) => boolean);
    against?: any;
};
declare type queryDef = {
    table: string;
    key?: any;
    where?: whereObj;
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
    query: (query: queryDef) => queryCollection;
    queryItems: (query: queryDef) => any[];
    activeChanges: collectionObj<changeObj[], number, changeObj>;
} & EventEmitter;
declare type tableObj = {
    name: string;
    data: mapCollection;
    addMany: (records: any[]) => any[];
    hasKey: (key: any) => boolean;
    addData: (data: any, meta?: any) => any;
    getData: (key: any) => any | undefined;
    recordForKey: (key: any, meta?: tableRecordMetaObj) => tableRecordObj;
    context: contextObj;
    restore: (store: anyMap) => tableObj;
    query: (query: queryDef) => queryCollection;
} & EventEmitter;
declare type dataContextObj = {
    name: string;
    context: contextObj;
};
declare type tableRecordJoinObj = {
    updateJoinedRecord: (tableRecordObj: any) => void;
    joinName: string;
    attachKey: string;
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
    data: any;
    tableName: string;
    key?: any;
    joinedRecords: Map<any, joinResult | undefined>;
    table: tableObj;
    context: contextObj;
    readonly value: any;
};

export { addDataMetaObj, anyMap, changeObj, contextObj, contextOptionsObj, dataContextObj, helperMap, joinConnObj, joinDefObj, joinFn, joinResult, keyProviderFn, mapCollection, queryCollection, queryDef, queryJoinDef, recordCreatorFn, stringMap, tableDefObj, tableObj, tableOptionsObj, tableRecordJoinObj, tableRecordMetaObj, tableRecordObj, whereObj };
