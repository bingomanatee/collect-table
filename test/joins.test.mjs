/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const {
  default: createContext, constants: {
    joinFreq
  },
  TableRecordJoin
} = pkg;

tap.test('joins', (joins) => {
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

  joins.test('TableRecordJoin', (trj) => {

    trj.test('context join one', cj => {

      const join = {joinName: 'home'};
      const record = ctx.table('users').data.reduce((memo, item, key, _s, stopper) => {
        if (item.name === 'Bill Smith') {
          stopper.final();
          return ctx.table('users').recordForKey(key);
        }
        return memo;
      });

      cj.same(record.data.name, 'Bill Smith');

      const helper = new TableRecordJoin(ctx, join);
      helper.updateJoinedRecord(record);
      cj.same(record.joinedRecords, new Map([['home', ctx.table('addr').recordForKey(1)]]));

      cj.same(record.value,
        {
          name: 'Bill Smith',
          email: 'bill@google.com',
          addID: 1,
          home: {
            id: 1,
            addr: '111 First Street',
            state: 'CA',
            country: 'US',
            postcode: 12345
          }
        }
      );

      cj.end();
    });

    trj.test('context join deep', cj => {

      const join = {
        joinName: 'home',
        joins: [
          {joinName: 'stateInfo'}
        ]
      };
      const record = ctx.table('users').data.reduce((memo, item, key, _s, stopper) => {
        if (item.name === 'Bill Smith') {
          stopper.final();
          return ctx.table('users').recordForKey(key);
        }
        return memo;
      });

      cj.same(record.data.name, 'Bill Smith');

      const helper = new TableRecordJoin(ctx, join);
      helper.updateJoinedRecord(record);
      cj.same(record.joinedRecords, new Map([['home', ctx.table('addr').recordForKey(1, {
        joins: join.joins
      })]]));

      cj.same(record.value,
        {
          name: 'Bill Smith',
          email: 'bill@google.com',
          addID: 1,
          home: {
            id: 1,
            addr: '111 First Street',
            state: 'CA',
            country: 'US',
            postcode: 12345,
            stateInfo: {
              name: 'California',
              code: 'CA'
            }
          }
        }
      );

      cj.end();
    });

    trj.test('backwards from state', manyJoin => {
      const record = ctx.table('states').recordForKey('CA');
      const join = {
        joinName: 'stateInfo'
      };

      const helper = new TableRecordJoin(ctx, join);

      helper.updateJoinedRecord(record);

      manyJoin.same(record.value,
        {
          name: 'California',
          code: 'CA',
          stateInfo: [
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
            }
          ]
        }
      )
      manyJoin.end();
    })

    trj.test('backwards from state deep', manyJoin => {
      const record = ctx.table('states').recordForKey('CA');
      const join = {
        joinName: 'stateInfo',
        joins: [
          {joinName: 'home'}
        ]
      };

      const helper = new TableRecordJoin(ctx, join);

      helper.updateJoinedRecord(record);

      manyJoin.same(record.value,
        {
          name: 'California',
          code: 'CA',
          stateInfo: [
            {
              id: 1,
              addr: '111 First Street',
              state: 'CA',
              country: 'US',
              postcode: 12345,
              "home": {
                "name": "Bill Smith",
                "email": "bill@google.com",
                "addID": 1,
              },
            },
            {
              id: 2,
              addr: '20 Broadway Ave',
              country: 'US',
              state: 'CA',
              postcode: 40443,
              "home": {
                name: "Ellen Fisk",
                email: "ellen@yahoo.com",
                addID: 2,
              },
            }
          ]
        }
      )
      manyJoin.end();
    })
    trj.end();
  });

  joins.test('1-1', (oneToOne) => {

    oneToOne.same(ctx.joins.size, 2);

    const queryItems = ctx.queryItems({
      table: 'users',
      joins: [{
        joinName: "home",
        as: 'addr'
      }]
    });

    oneToOne.same(queryItems,
      [
        {
          name: 'Bill Smith',
          email: 'bill@google.com',
          addID: 1,
          addr: {id: 1, addr: '111 First Street', state: 'CA', country: 'US', postcode: 12345}
        },
        {
          name: 'Sal Jones',
          email: 'sal@yahoo.com',
          addID: 3,
          addr: {id: 3, addr: '333 Trinity Ave', state: 'OR', country: 'US', postcode: 72332}
        },
        {name: 'Dave Clark', email: 'nosferatu@transylvania.com'},
        {
          name: 'Ellen Fisk',
          email: 'ellen@yahoo.com',
          addID: 2,
          addr: {id: 2, addr: '20 Broadway Ave', state: 'CA', country: 'US', postcode: 40443}
        }
      ]
    )

    oneToOne.end();
  });

  joins.test('deep', (deep) => {

    const queryItems = ctx.queryItems({
      table: 'users',
      joins: [{
        joinName: "home",
        as: 'addr',
        joins: [
          {joinName: 'stateInfo'}
        ]
      }]
    });

    /**
     *       {name: 'California', code: 'CA'},
     {name: 'Oregon', code: 'OR'},
     */
    deep.same(queryItems,
      [
        {
          name: 'Bill Smith',
          email: 'bill@google.com',
          addID: 1,
          addr: {
            id: 1,
            addr: '111 First Street',
            state: 'CA',
            country: 'US',
            postcode: 12345,
            stateInfo: {name: 'California', code: 'CA'},
          }
        },
        {
          name: 'Sal Jones',
          email: 'sal@yahoo.com',
          addID: 3,
          addr: {
            id: 3,
            addr: '333 Trinity Ave',
            state: 'OR',
            country: 'US',
            postcode: 72332,
            stateInfo: {name: 'Oregon', code: 'OR'},
          }
        },
        {name: 'Dave Clark', email: 'nosferatu@transylvania.com'},
        {
          name: 'Ellen Fisk',
          email: 'ellen@yahoo.com',
          addID: 2,
          addr: {
            id: 2,
            addr: '20 Broadway Ave',
            state: 'CA',
            country: 'US',
            postcode: 40443,
            stateInfo: {name: 'California', code: 'CA'},
          }
        }
      ]
    )

    deep.end();
  });

  joins.end();
}, {skip: true});
