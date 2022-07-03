import Base from "./Base";

export {QueryFetchStream} from './QueryFetchStream';
export { Base };
export * as constants from './constants';
export { Table } from "./Table";
export {TableRecordJoin} from "./helpers/TableRecordJoin";
export default (tables?, opts?) => new Base(tables, opts);
