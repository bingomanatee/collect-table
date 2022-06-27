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
declare enum binaryOperator {
    matches = "matches",
    re = "re",
    eq = "=",
    gt = ">",
    lt = "<",
    gte = ">=",
    lte = "<=",
    ne = "!=",
    same = "same"
}
declare enum booleanOperator {
    and = "&",
    or = "||"
}

declare type helperMap = Map<queryJoinDef, tableRecordJoinObj>;
declare type anyMap = Map<any, any>;
declare type stringMap = Map<string, any>;
declare type mapCollection = collectionObj<Map<any, any>, any, any>;
declare type tableRecordMetaObj = {
    helpers?: helperMap;
    joins?: stringMap;
};
declare type joinDefObj = {
    name?: string;
    from: joinConnObj;
    to: joinConnObj;
};
declare type dataSetSelectorFn = (keys: any[], source: mapCollection, ds: dataSetObj) => any[];
declare type dataSetReducerFn = (data: mapCollection, ds: dataSetObj) => any;
declare type dataSetMapFn = (data: tableRecordObj, ds: dataSetObj) => mapCollection;
declare type dataSetParams = {
    context: contextObj;
    sourceTable: string;
    source?: mapCollection;
    keys?: any[];
    reducer?: dataSetReducerFn;
    data?: mapCollection;
    selector?: dataSetSelectorFn;
    map?: dataSetMapFn;
    meta?: any;
    value?: any;
};
declare type joinResult = tableRecordObj | tableRecordObj[] | undefined;
declare type tableOptionsObj = {
    keyProvider?: keyProviderFn;
    key?: any;
    recordCreator?: dataCreatorFn;
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
declare type innerBinaryFn = (recordTerm: any, recordAgainst: any, record: tableRecordObj, term: binaryTestObj) => boolean;
declare type dataCreatorFn = (table: tableObj, data: any, key?: any) => any;
declare type keyProviderFn = (target: any, table: tableObj, meta?: any) => any[];
declare type joinFn = (record: tableRecordObj, args?: any) => any;
declare type recordFn = (tableRecordObj: any) => any;
declare type recordTestFn = (tableRecordObj: any) => boolean;
declare type queryEachFn = (record: tableRecordValueObj, ctx: contextObj, table: tableObj) => any;
declare type whereTerm = recordTestFn | binaryTestObj | whereUnionObj;
declare type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
declare type binaryTestObjBase = {
    termFn?: recordFn;
    field?: string;
    test: binaryOperator;
    against?: any;
    againstFn?: recordFn;
};
declare type binaryTestObjB2 = RequireAtLeastOne<binaryTestObjBase, 'termFn' | 'field'>;
declare type binaryTestObj = RequireAtLeastOne<binaryTestObjB2, 'against' | 'againstFn'>;
declare type whereUnionObj = {
    tests: whereTerm[];
    bool: booleanOperator;
};
declare type joinConnObj = {
    frequency?: joinFreq;
    as?: string;
} & queryDef;
declare type queryJoinDef = {
    joinName?: string;
    as?: string;
    connections?: joinConnObj[];
} & queryDef;
declare type queryDef = {
    tableName: string;
    key?: any;
    where?: whereTerm;
    joins?: queryJoinDef[];
};
declare type dataSetObj = {
    context: contextObj;
    source: mapCollection;
    keys: any[];
    selected: mapCollection;
    data: mapCollection;
    value: mapCollection;
    tableName: string;
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
    query: (query: queryDef) => dataSetObj;
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
    query: (query: queryDef) => dataSetObj;
    queryEach: (query: queryDef, action: queryEachFn) => void;
    setMany: (keys: any, field: any, value: any) => void;
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
declare type tableRecordValueObj = {
    tableName: any;
    key: any;
    data: any;
};
declare type tableRecordObj = {
    data: any;
    tableName: string;
    key: any;
    table: tableObj;
    context: contextObj;
    get: (field: any) => any;
    set: (field: any, value: any) => void;
    exists: boolean;
    value: tableRecordValueObj;
};

export { addDataMetaObj, anyMap, binaryTestObj, changeObj, contextObj, contextOptionsObj, dataContextObj, dataCreatorFn, dataSetMapFn, dataSetObj, dataSetParams, dataSetReducerFn, dataSetSelectorFn, helperMap, innerBinaryFn, joinConnObj, joinDefObj, joinFn, joinResult, keyProviderFn, mapCollection, queryDef, queryEachFn, queryJoinDef, recordFn, recordTestFn, stringMap, tableDefObj, tableObj, tableOptionsObj, tableRecordJoinObj, tableRecordMetaObj, tableRecordObj, tableRecordValueObj, whereTerm, whereUnionObj };
