/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import { create } from '@wonderlandlabs/collect';
import { createBase, constants, QueryFetchStream } from '../dist/carpenter.es.js';
import initTestBase from '../testHelpers/initTestBase.mjs';
import qfs_result_stream from '../testExpect/qfs_result_stream.json' assert { type: 'json' };

const {
  joinFreq
} = constants;

tap.test('DataSet', (suite) => {

  suite.test('fetchStream', (fs) => {
    const ctx = initTestBase(createBase, joinFreq);

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
    stream.subscribe((data) => hits.push(create(data).items.map(r => r.value)));

    fs.same(hits, qfs_result_stream.slice(0, 1));

    ctx.transact(() => {
      ctx.table('addr').add(
        {
          id: 6,
          addr: '111 Market',
          postcode: 823352,
          state: 'CA'
        }
      );
      ctx.table('users').add(
        { name: 'Newby Newface', email: 'newby@google.com', addID: 6 });
    });

    /*   console.log('fetchStream: ========= hits after :', JSON.stringify(hits)
          .replace(/\{/g, "\n{")
          .replace(/\[/g, "\n[")
        );*/

    fs.same(hits, qfs_result_stream.slice(0, 2));
    fs.end();
  });

  suite.end();
});
