/* eslint-disable no-unused-vars */
export enum changePhases {
  new,
  started,
  executed,
  validated,
  complete,
  failed,
}

export enum tableChangeTypeEnum {
  added,
  updated,
  deleted,
}

export enum joinFreq {
  noneOrOne= 'noneOrOne',
  one = 'one',
  noneOrMore = 'noneOrMore',
  oneOrMore = 'oneOrMore',
}

export enum tableRecordState {
  new,
  saved,
  deleted,
}

export enum binaryOperator {
  matches = 'matches',
  re = 're',
  eq = '=',
  gt = '>',
  lt = '<',
  gte = '>=',
  lte = '<=',
  ne = '!=',
  same = 'same',
}

export enum booleanOperator {
  and = '&',
  or = '||',
}

export enum joinForm {
  manyToMany= 'm2m',
  toForeignKey = 'toFK',
  fromForeignKey = 'fromFK',
  foreignToForeignKey = 'F2FK',
  keyToKey = 'key2key',
  badJoin = 'BAD',
}

export const whereValueKey = Symbol('value');
