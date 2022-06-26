/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
const {
  default: createContext, constants: {
    joinFreq
  },
  DataSet
} = pkg;

function makeContext ()  {
  return createContext([{
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
        from: {
          table: 'users',
          key: 'addID',
          frequency: joinFreq.noneOrOne
        },
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
}
tap.test('DataSet', (suite) => {

  suite.test('minimal', (min) => {
    const ctx = makeContext();

    const ds = new DataSet({
      context: ctx,
      sourceTable: 'users'
    });

    min.same(new Set(ds.keys), new Set(ctx.table('users').data.keys));
    min.same(new Set(ds.data.items), new Set(ctx.table('users').data.items));
    min.end();
  });


  suite.test('with key selector', (withKey) => {
    const ctx = makeContext();

    const ds = new DataSet({
      context: ctx,
      sourceTable: 'users',
      selector : (keys, data) => {
        return keys.filter((key) => !!data.get(key).addID);
      }
    });

    const usersWithDataIds = ctx.table('users').data.cloneShallow().filter((item) => !!item.addID);

    withKey.same(new Set(ds.keys), new Set(usersWithDataIds.keys));
    withKey.same(new Set(ds.data.items), new Set(usersWithDataIds.items));
    withKey.end();
  });

  suite.end();
})
