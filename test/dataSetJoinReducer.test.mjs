/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
import makeContext from "./testHelpers/makeContext";
const {
  default: createContext,
  DataSet,
  constants: {
    joinFreq
  },
  dataSetJoinReducer,
  TableRecordJoin,
} = pkg;
const  {
 // default: dsjr,
 // recordsForJoin,
  keysForJoin,
} = dataSetJoinReducer;

tap.test('dataSetJoinReducer', suite => {

  suite.test('keysForJoin', (kfj) => {
     const ctx = makeContext(createContext, joinFreq);
      const ds = new DataSet({
        sourceTable: 'users',
        context: ctx
      });

      const query = {
        tableName: 'users',
        joins: [
          {joinName: 'home'}
        ]
      };

      const helper = new TableRecordJoin(ctx,  query.joins[0], query);

      const addrKeys = keysForJoin(helper, ds, query);

      console.log('addrKeys: ', addrKeys);

    kfj.end();
  });

  suite.end();
})
