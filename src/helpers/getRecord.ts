import { BehaviorSubject } from 'rxjs';
import TableRecord from './TableRecord';

export default function getRecord ({ name, context }, keyOrReducer, meta?) {
    const record = new TableRecord({ name, context }, keyOrReducer, meta);
    return new BehaviorSubject(record.data);
}
