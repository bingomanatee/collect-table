import { create, enums } from '@wonderlandlabs/collect';
import isEqual from 'lodash.isequal';
import {
  binaryTestObj,
  innerBinaryFn,
  queryDef,
  recordTestFn,
  tableRecordObj,
  whereTerm,
  whereUnionObj
} from "../types";
import { binaryOperator, booleanOperator } from "../constants";

const {FormEnum} = enums;

const noopFn = (_record: tableRecordObj) => true;

export default function whereFn(query: queryDef) : recordTestFn {
  if (!query.where) {
    return noopFn;
  }
  return whereClauseFn(query.where);
}

function isTestFn(clause: whereTerm): clause is recordTestFn {
  return typeof clause === 'function';
}

function isUnion(clause: whereTerm): clause is whereUnionObj {
  return (create(clause).form === FormEnum.object) && 'bool' in clause;
}

function isBinary(clause: whereTerm): clause is binaryTestObj {
  return (create(clause).form === FormEnum.object) && 'test' in clause;
}

const whereClauseFn = (term: whereTerm) : recordTestFn => {
  if (isTestFn(term)) {
    return term;
  }
  if (isUnion(term)) {
    return whereUnionFn(term);
  }
  if (isBinary(term)) {
    return binaryFn(term);
  }
  return noopFn;
}

const whereUnionFn = (term: whereUnionObj) : recordTestFn => {
  const {
    tests,
    bool
  } = term;

  const termTests = create(tests).map(whereClauseFn);
  if (termTests.size < 1) {
    return noopFn;
  }

  return (record: tableRecordObj) : boolean => {
    switch (bool) {
      case booleanOperator.and:
        return termTests.map((test) => test(record)).every();
        break;

      case booleanOperator.or:
        return termTests.reduce((memo, test, _s, stopper) => {
          const result = test(record);
          if (!result) {
            stopper.final();
            return false;
          }
          return memo;
        }, true);
        break;

      default:
        return true;
    }
  }
}

function eqTest(recordTerm, recordAgainst) {
  return recordTerm === recordAgainst;
}

function compareRegExp(recordTerm, recordAgainst, record, term) {
  // @ts-ignore
  if (typeof recordTerm !== 'string') {
    // eslint-disable-next-line no-param-reassign
    recordTerm = String(recordTerm);
  }
  // @ts-ignore
  if (typeof recordAgainst === 'string') {
    // eslint-disable-next-line no-param-reassign
    recordAgainst = new RegExp(recordAgainst);
  }
  if (!(recordAgainst instanceof RegExp)) {
    console.warn('term re test: against not a regExp; record', record, 'term:', term);
    return false;
  }
  return recordAgainst.test(recordTerm);
}

function sameTest (a, b) {
  return isEqual(a, b);
}

function gtTest(recordTerm, recordAgainst) {
  return recordTerm > recordAgainst;
}

function lessThanTest(recordTerm, recordAgainst) {
  return recordTerm < recordAgainst;
}

function gteTest(recordTerm, recordAgainst) {
  return recordTerm >= recordAgainst;
}

function lteTest(recordTerm, recordAgainst) {
  return recordTerm <= recordAgainst;
}

function binaryAlwaysTrue(_a, _b, term) {
  console.log('--- default test hit - should never happen; term is', term);
  return true;
}

const binaryFn = (term: binaryTestObj) => {
  let {
    // eslint-disable-next-line prefer-const
    test, against, field, termFn, againstFn
  } = term;

  let innerTest: innerBinaryFn = binaryAlwaysTrue;

  switch (test) {
    case binaryOperator.re:
      innerTest = compareRegExp;
      break;

    case binaryOperator.ne:
      innerTest = (recordTerm, recordAgainst) => recordTerm !== recordAgainst;
    break;

    case binaryOperator.eq:
      innerTest = eqTest;
      break;

    case binaryOperator.gt:
      innerTest = gtTest;
      break;

    case binaryOperator.lt:
      innerTest = lessThanTest;
      break;

    case binaryOperator.gte:
      innerTest = gteTest;
      break;

    case binaryOperator.lte:
      innerTest = lteTest;
      break;

    case binaryOperator.same:
      innerTest = sameTest;
      break;

    default:
      throw new Error('bad test type');
  }

  return (record) => {
    const recordTerm = termFn? termFn(record) : record.get(field);
    const againstTerm = againstFn? againstFn(record) : against;

    // @ts-ignore
    const result = innerTest(recordTerm, againstTerm, record, term);
    return result;
  };
}
