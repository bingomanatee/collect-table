import { isCollection } from '../typeGuards';
import { create } from '@wonderlandlabs/collect';

export default (record) => {
  if (isCollection(record)) {
    return record;
  }
  return create(record);
};
