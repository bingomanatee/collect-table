/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const { default: createContext } = pkg;

tap.test('CollectionTable', (ct) => {
  const userCreator = (_table, item) => {
    if (!((typeof item.name === 'string') && /^[\w ]{4,}$/.test(item.name))) {
      throw new Error('no/bad name');
    }
    if (!((typeof item.email === 'string') && /^.+@.+\..+$/.test(item.email))) {
      throw new Error('no/bad email');
    }
    return {
      name: item.name,
      email: item.email
    }
  };

  ct.test('constructor', (conTest) => {

    conTest.test('basic tableName creation', (bas) => {
      const ctx = createContext(['users', 'addrs']);
      bas.ok(ctx.hasTable('users'));
      bas.ok(ctx.hasTable('addrs'));
      bas.notOk(ctx.hasTable('bassoons'));
      bas.end();
    });

    conTest.test('recordCreator', (rcTest) => {
      const ctx = createContext();
      const users = ctx.table('users', {
        recordCreator: userCreator
      });

      const { data } = users.add({ name: 'Bob Smith', email: 'bob@foo.com', junk: 'not included' });
      rcTest.same(data, { name: 'Bob Smith', email: 'bob@foo.com' });
      rcTest.throws(() => {
        users.add({ name: 'Sam', email: 'sam@google.com' }); // name too short
      }, /no\/bad name/)
      rcTest.end();
    })

    conTest.end();
  });

  ct.test('get/add', (keyTest) => {
    keyTest.test('should create, get record value', (indexTest) => {
      const ctx = createContext();
      const userTable = ctx.table('users');

      const { key } = userTable.add({ name: 'Bob', role: 'admin' });
      const data = userTable.getData(key);

      indexTest.same(data.name, 'Bob');
      indexTest.same(data.role, 'admin');
      indexTest.end();
    });
    keyTest.end();
  });

  ct.test('addMany', (amTest) => {
    const dataSource = [
      [1, { name: 'Bob', email: 'bob@email.com' }],
      [2, { name: 'Sally', email: 'sally@google.com' }],
    ];

    amTest.test('basic', basicTest => {
      const ctx = createContext();
      const userTable = ctx.table('users');

      const result = userTable.addMany([
        { name: 'Bob', email: 'bob@email.com' },
        { name: 'Sally', email: 'sally@google.com' }
      ]);

      basicTest.same(result, {
        result: new Map(dataSource)
      })

      basicTest.notOk(ctx.lastChange);
      basicTest.end();
    })

    amTest.test('with bad data', (badTest) => {
      const ctx = createContext();
      const users = ctx.table('users', {
        recordCreator: userCreator,
        data: [
          userCreator({}, {name: 'Rick Steve', email: 'rick@yahoo.com'}),
          userCreator({}, {name: 'Peter Parker', email: 'pparker@nyu.com'}),
        ]
      });

      badTest.throws(() => {
        users.addMany(dataSource);
      }, /no\/bad name/);

      badTest.same(users.data.size, 2);

      badTest.end();
    });
    amTest.end();


  })

  ct.end();
});
