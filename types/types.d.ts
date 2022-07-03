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

declare type helperMap = Map<queryJoinDef, tableRecordJoin>;
declare type anyMap = Map<any, any>;
declare type stringMap = Map<string, any>;
declare type mapCollection = collectionObj<anyMap, any, any>;
declare type tableRecordNotesColl = collectionObj<stringMap, string, any>;
declare type recordSetMap = Map<any, recordObj>;
declare type recordSetCollection = collectionObj<recordSetMap, any, recordObj>;
declare type tableRecordMetaObj = {
    helpers?: helperMap;
    joins?: stringMap;
};
declare type joinDefObj = {
    name?: string;
    from: joinConnObj;
    to: joinConnObj;
    joinTableName?: string;
};
declare type tableRecordJoin = {
    joinDef: queryJoinDef;
    foreignConn?: joinConnObj;
    localConn?: joinConnObj;
    joinName?: string;
    baseJoinDef: queryJoinDef | undefined;
    localIsPlural: boolean;
    foreignIsPlural: boolean;
    attachKey: string;
    tableName: string;
};
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
declare type baseOptsObj = {
    joins?: joinDefObj[];
};
declare type stringObj = {
    [key: string]: any;
};
declare type innerBinaryFn = (recordTerm: any, recordAgainst: any, record: recordObj, term: binaryTestObj) => boolean;
declare type dataCreatorFn = (table: tableObj, data: any, key?: any) => any;
declare type keyProviderFn = (target: any, table: tableObj, meta?: any) => any[];
declare type recordFn = (tableRecordObj: any) => any;
declare type recordTestFn = (tableRecordObj: any) => boolean;
declare type queryEachFn = (record: tableRecordValueObj, ctx: baseObj, table: tableObj) => any;
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
    tableName: string;
    key?: any;
    joinTableField: string;
};
declare type queryClauses = {
    where?: whereTerm;
    joins?: queryJoinDef[];
};
declare type queryJoinDef = {
    joinName?: string;
    as?: string;
    connections?: joinConnObj[];
    joinTableName?: string;
} & queryClauses;
declare type queryDef = {
    tableName: string;
    key?: any;
    keys?: any[];
} & queryClauses;
declare type baseObj = {
    transact: (fn: (changesObj: any) => any) => any;
    now: number;
    next: number;
    hasTable: (name: string) => boolean;
    table: (name: string, options?: tableOptionsObj) => tableObj;
    lastChange: changeObj | undefined;
    restoreTable(name: string, table: mapCollection): any;
    joins: collectionObj<Map<string, joinDefObj>, string, joinDefObj>;
    query: (query: queryDef) => recordObj[];
    queryItems: (query: queryDef) => any[];
    activeChanges: collectionObj<changeObj[], number, changeObj>;
    stream: (query: queryDef, listener: any) => any;
} & EventEmitter;
declare type tableObj = {
    name: string;
    data: mapCollection;
    addMany: (records: any[]) => any[];
    hasKey: (key: any) => boolean;
    addData: (data: any, meta?: any) => any;
    getData: (key: any) => any | undefined;
    recordForKey: (key: any, meta?: tableRecordMetaObj) => recordObj;
    base: baseObj;
    restore: (store: anyMap) => tableObj;
    query: (query: queryDef) => recordObj[];
    queryEach: (query: queryDef, action: queryEachFn) => void;
    setMany: (keys: any, field: any, value: any) => void;
    stream: (query: queryDef, listener: any) => any;
    removeKey: (key: any) => void;
    removeItem: (item: any) => void;
    removeQuery: (query: stringObj) => void;
    join: (keyMap: anyMap, joinName: string) => void;
} & EventEmitter;
declare type changeObj = {
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
declare type tableRecordValueObj = {
    tableName: any;
    key: any;
    data: any;
    joins?: {
        [joinName: string]: recordObj[];
    };
};
declare type recordObj = {
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
};

export { addDataMetaObj, anyMap, baseObj, baseOptsObj, binaryTestObj, changeObj, dataCreatorFn, helperMap, innerBinaryFn, joinConnObj, joinDefObj, keyProviderFn, mapCollection, queryClauses, queryDef, queryEachFn, queryJoinDef, recordFn, recordObj, recordSetCollection, recordSetMap, recordTestFn, stringMap, stringObj, tableDefObj, tableObj, tableOptionsObj, tableRecordJoin, tableRecordMetaObj, tableRecordNotesColl, tableRecordValueObj, whereTerm, whereUnionObj };
