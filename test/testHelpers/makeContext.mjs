

module.exports = function makeContext (createContext, joinFreq)  {
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
