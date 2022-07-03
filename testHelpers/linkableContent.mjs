

export default function makeContext (createContext, joinFreq)  {
  return createContext([{
    name: 'states',
    data: [
      {name: 'California', code: 'CA'},
      {name: 'Oregon', code: 'OR'},
      {name: 'Kentucky', code: 'KY'},
    ],
    'key': 'code',
  }, {
    name: 'users',
    data: [
      {name: 'Bill Smith', email: 'bill@google.com', age: 25, gender: 'm', addID: 1},
      {name: 'Sal Jones', email: 'sal@yahoo.com', age: 40, gender: 'f',  addID: 3},
      {name: 'Dave Clark', email: 'nosferatu@transylvania.com', age: 60, gender: 'm',},
      {name: 'Ellen Fisk', email: 'ellen@yahoo.com', age: 27, gender: 'f',  addID: 2},
      {name: 'Bob NoState', email: 'bob@yahoo.com', age: 74, gender:'m', addID: 4}
    ]
  },
    {
      name: 'hats',
      key: 'sku',
      data: [
        {name: 'red hat', sku: 101101, const: 300},
        {name: 'top hat', sku: 36363,  cost: 1200},
        {name: 'white hat', sku: 3463327, cost: 200},
        {name: 'construction hat', sku: 73763784, cost: 30},
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
        },
        {
          id: 4,
          addr: '100 noState Lane',
          postcode: 123213
        },
        {
          id: 5,
          addr: '50 nobodyLivesHere Lane',
          postcode: 112345,
          state: 'KY'
        }
      ],

      key: 'id',
    }], {
    joins: [
      {
        from: {
          tableName: 'users',
          frequency: 'noneOrMore',
        },
        to: {
          tableName: 'hats',
          frequency: 'noneOrMore',
        },
        name: 'userHats',
        joinTableName: 'user_hats',
      },
      {
        from: {
          tableName: 'users',
          key: 'addID',
          frequency: joinFreq.noneOrOne
        },
        to: {
          tableName: 'addr',
          frequency: joinFreq.noneOrOne
        },
        name: 'home'
      },
      {
        from: {
          tableName: 'addr',
          frequency: joinFreq.noneOrMore,
          key: 'state'
        },
        to: {
          tableName: 'states',
          frequency: joinFreq.noneOrOne
        },
        name: 'stateInfo'
      }
    ]
  });
}
