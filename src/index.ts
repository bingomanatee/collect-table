import Context from "./Context";

export * as constants from './constants';
export { CollectionTable } from "./CollectionTable";
export default (tables?, opts?) => new Context(tables, opts);
