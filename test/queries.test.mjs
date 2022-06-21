/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const {
  default: createContext, constants: {
    joinFreq
  }
} = pkg;

tap.test('queries', (suite) => {
  const ctx = createContext([{
    name: 'states',
    data: [
      {name: 'California', code: 'CA'},
      {name: 'Oregon', code: 'OR'},
    ],
    'key': 'code',
  }, {
    name: 'users',
    data: [
      {name: 'Bill Smith', email: 'bill@google.com', addID: 1},
      {name: 'Sal Jones', email: 'sal@yahoo.com', addID: 3},
      {name: 'Dave Clark', email: 'nosferatu@transylvania.com'},
      {name: 'Ellen Fisk', email: 'ellen@yahoo.com', addID: 2}
    ]
  },
    {
    name: 'addr',
    data: [
      {
        id: 1,
        addr: '111 First Street',
        state: 'CA',
        country: 'US',
        postcode: 12345
      },
      {
        id: 2,
        addr: '20 Broadway Ave',
        country: 'US',
        state: 'CA',
        postcode: 40443
      },
      {
        id: 3,
        addr: '333 Trinity Ave',
        state: 'OR',
        country: 'US',
        postcode: 72332
      }
    ],

    key: 'id',
  }], {
    joins: [
      {
        from: 'users.addID',
        to: {
          table: 'addr',
          frequency: joinFreq.noneOrOne
        },
        name: 'home'
      },
      {
        from: 'addr.state',
        to: {
          table: 'states',
          frequency: joinFreq.noneOrOne
        },
        name: 'stateInfo'
      }
    ]
  });
  suite.test(eqTest => {

      const queryItems = ctx.queryItems({
        table: 'users',
        where: {
          field: 'name',
          test: 'eq',
          against: 'Bill Smith'
        }
      });

      eqTest.same(queryItems.length, 1);
      eqTest.same(queryItems[0], {
        name: 'Bill Smith',
        email: 'bill@google.com',
        addID: 1,
      });

      eqTest.end();
    });
  suite.test(reTest => {

      const queryItems = ctx.queryItems({
        table: 'users',
        where: {
          field: 'email',
          test: 'matches',
          against: /@yahoo\.com$/i
        }
      });

      reTest.same(queryItems.length, 2);
      reTest.same(queryItems.map((u => u.name)), ['Sal Jones', 'Ellen Fisk']);

      reTest.end();
    });
  suite.end();
}, {skip: true});
