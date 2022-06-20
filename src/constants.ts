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
