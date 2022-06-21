import Context from "./Context";

export * as constants from './constants';
export { CollectionTable } from "./CollectionTable";
export {TableRecordJoin} from "./helpers/TableRecordJoin";
export default (tables?, opts?) => new Context(tables, opts);
