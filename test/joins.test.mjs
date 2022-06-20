/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const {
  default: createContext, constants: {
    joinFreq
  }
} = pkg;

tap.test('joins', (joins) => {
  joins.test('1-1', (oneToOne) => {
    const ctx = createContext([{
      name: 'users',
      data: [
        { name: 'Bill Smith', email: 'bill@google.com', addID: 1 },
        { name: 'Sal Jones', email: 'sal@yahoo.com', addID: 3 },
        { name: 'Dave Clark', email: 'nosferatu@transylvania.com' },
        { name: 'Ellen Fisk', email: 'ellen@yahoo.com', addID: 2 }
      ]
    }, {
      name: 'addr',
      data: [
        {
          id: 1,
          addr: '111 First Street',
          country: 'US',
          postcode: 12345
        },
        {
          id: 2,
          addr: '20 Broadway Ave',
          country: 'US',
          postcode: 40443
        },
        {
          id: 3,
          addr: '333 Trinity Ave',
          country: 'US',
          postcode: 72332
        }
      ],

      keyProvider: (table, data) => {
        return data.id;
      }
    }], {
      joins: [
        {
          from: 'users.addID',
          to: {
            table: 'addr',
            frequency: joinFreq.noneOrOne
          },
          name: 'users_addrs'
        }
      ]
    });
    oneToOne.same(ctx.joins.size, 1);
    const addrTable = ctx.table('addr');
    console.log('addresses: ', addrTable.data.items);

    oneToOne.same(ctx.joins.store, new Map([
      ["users_addID_addr",
        {
          "name": "users_addID_addr",
          context: ctx,
          from: {
            table: 'users', key: 'addID', "frequency": "noneOrOne",
          },
          to: {
            table: 'addr', "frequency": "noneOrOne",
          },
        }]
    ]));

    const joinedData = ctx.query({
      table: 'users', joinName: "users_addID_addr",
      joins: [{
        joinName: "users_addID_addr",
        as: 'addr'
      }]
    })

    oneToOne.same(joinedData,
      [
         {
             name: 'Bill Smith',
         email: 'bill@google.com',
         addID: 1,
         addr: { id: 1, addr: '111 First Street', country: 'US', postcode: 12345 }
       },
       {
           name: 'Sal Jones',
         email: 'sal@yahoo.com',
         addID: 3,
         addr: { id: 3, addr: '333 Trinity Ave', country: 'US', postcode: 72332 }
       },
       { name: 'Dave Clark', email: 'nosferatu@transylvania.com' },
       {
           name: 'Ellen Fisk',
         email: 'ellen@yahoo.com',
         addID: 2,
         addr: { id: 2, addr: '20 Broadway Ave', country: 'US', postcode: 40443 }
       }
     ]
  )

    oneToOne.end();
  });
  joins.end();
});
