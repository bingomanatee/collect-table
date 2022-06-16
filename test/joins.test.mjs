/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const {default: createContext} = pkg;

tap.test('joins', (joins) => {
  joins.test('1-1', (oneToOne) => {
    const ctx = createContext(['users', 'addr'], {
      joins: [
        {from: 'users.addID', to: 'addr', name: 'users_addrs'}
      ]
    });
    oneToOne.same(ctx.joins.size, 1);
    const userTable = ctx.table('users');
    console.log('ctx.joins: ', ctx.joins.store);

    oneToOne.end();
  });
  joins.end();
});
