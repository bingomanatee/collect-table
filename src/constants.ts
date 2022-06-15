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
  noneOrOne,
  one,
  noneOrMore,
  oneOrMore,
}

export enum tableRecordState {
  new,
  saved,
  deleted,
}
