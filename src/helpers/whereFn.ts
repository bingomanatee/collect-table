import {create} from '@wonderlandlabs/collect';
import eq from 'lodash.isequal';
import {queryDef, tableRecordObj} from "../types";


export default function whereFn(query: queryDef) {
  let out = (_record: tableRecordObj) => false;
  if (!query.where) {
    return out;
  }
  let {
    // eslint-disable-next-line prefer-const
    test, against, field
  } = query.where;

  if (typeof test === 'function') {
    return test;
  }

  switch (test) {

    case 'matches':
    case 're':
      if (!(against instanceof RegExp)) {
        if (typeof against === 'string') {
          against = new RegExp(against);
        }
      }
      out = (record: tableRecordObj) => {
        let value = create(record.data).get(field);
        if (typeof value !== 'string') {
          value = String(value);
        }
        return against.test(value);
      }
      break;

    case '!=':
    case 'ne':
    case 'not':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return !eq(value, against);
      }
      break;

    case '=':
    case 'eq':
    case '<>':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return eq(value, against);
      }
      break;

    case '>':
    case 'gt':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return value > against;
      }
      break;

    case '<':
    case 'lt':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return value < against;
      }
      break;

    case '>=':
    case 'gte':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return value > against || eq(value, against);
      }
      break;

    case '<=':
    case 'lte':
      out = (record: tableRecordObj) => {
        const value = create(record.data).get(field);
        return value < against || eq(value, against);
      }
      break;

    default:
      console.warn('cannot test with ', query.where, 'unknown test type')
  }

  return out;
}
