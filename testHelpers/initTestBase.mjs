

export default function initTestBase (createContext, joinFreq)  {
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
      {name: 'Bill Smith', email: 'bill@google.com', addID: 1},
      {name: 'Sal Jones', email: 'sal@yahoo.com', addID: 3},
      {name: 'Dave Clark', email: 'nosferatu@transylvania.com'},
      {name: 'Ellen Fisk', email: 'ellen@yahoo.com', addID: 2},
      {name: 'Bob NoState', email: 'bob@yahoo.com', addID: 4}
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
