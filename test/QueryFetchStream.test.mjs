/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import { create } from '@wonderlandlabs/collect';

import pkg from '../dist/index.js';
import makeContext from "../testHelpers/makeContext.mjs";
import qfs_result_stream from '../testExpect/qfs_result_stream.json' assert {type: 'json'};
const {
  default: createContext, constants: {
    joinFreq
  },
  QueryFetchStream
} = pkg;

tap.test('DataSet', (suite) => {

  suite.test('fetchStream', (fs) => {
    const ctx = makeContext(createContext, joinFreq);

    const stream = new QueryFetchStream(
      ctx,
      {
        tableName: 'users',
        joins: [
          {
            joinName: 'home',
            as: 'home_addr',
            joins: [
              {
                joinName: 'stateInfo',
                as: 'state_detail',
              }
            ]
          }
        ]
      });

    const hits = [];
    stream.subscribe((data) => hits.push(create(data).items));

    fs.same(hits, qfs_result_stream.slice(0, 1));

    ctx.transact(() => {
      ctx.table('addr').addData(
        {
          id: 6,
          addr: '111 Market',
          postcode: 823352,
          state: 'CA'
        }
      )
      ctx.table('users').addData(
        {name: 'Newby Newface', email: 'newby@google.com', addID: 6});
    })

    fs.same(hits, qfs_result_stream.slice(0, 2));
/*   console.log('========= hits after :', JSON.stringify(hits)
      .replace(/\{/g, "\n{")
      .replace(/\[/g, "\n[")
    );*/

    fs.end();
  });

  suite.end();
})
