import { recordObj } from '../types';

export default function recordArrayToMap (records: recordObj[]): any {
  return records.reduce(
    (memo, record) => {
      memo.set(record.key, record);
      return memo;
    }
    , new Map()
  );
}
