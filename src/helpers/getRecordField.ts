import { create } from '@wonderlandlabs/collect';
import { isTableRecord } from '../typeGuards';

export default function getRecordField (record, field) {
  if (isTableRecord(record)) {
    return record.get(field);
  }
  return create(record.data).get(field);
}
