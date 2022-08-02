import Base from './Base';

export { QueryFetchStream } from './helpers/QueryFetchStream';
export { Base };
export * as constants from './constants';
export { Table } from './Table';
export { TableRecordJoin } from './helpers/TableRecordJoin';
export const createBase = (tables?, opts?) => new Base(tables, opts);
