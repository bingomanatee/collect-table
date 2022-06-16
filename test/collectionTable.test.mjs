/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';

const {default: createContext} = pkg;

tap.test('CollectionTable', (ct) => {
  const userCreator = (table, record) => {
    if (!((typeof record.name === 'string' ) && /^[\w ]{4,}$/.test(record.name))) {
      throw new Error('no/bad name');
    }
    if (!((typeof record.email === 'string') && /^.+@.+\..+$/.test(record.email))) {
      throw new Error('no/bad email');
    }
    return {
      name: record.name,
      email: record.email
    }
  };

  ct.test('constructor', (conTest) => {

    conTest.test('basic table creation', (bas) => {
      const ctx = createContext(['users', 'addrs']);
      bas.ok(ctx.hasTable('users'));
      bas.ok(ctx.hasTable('addrs'));
      bas.notOk(ctx.hasTable('bassoons'));
      bas.end();
    });

    conTest.test('recordCreator', (rcTest) => {
      const ctx = createContext();
      const users = ctx.table('users',  {
        recordCreator: userCreator
      });

      const { record } = users.addRecord({name: 'Bob Smith', email: 'bob@foo.com', junk: 'not included'});
      rcTest.same(record, {name: 'Bob Smith', email: 'bob@foo.com'});
      rcTest.throws(() => {
        users.addRecord({name: 'Sam', email: 'sam@google.com'}); // name too short
      }, /no\/bad name/)
      rcTest.end();
    })

    conTest.end();
  });

  ct.test('get/addRecord', (keyTest) => {
    keyTest.test('should create, get record value', (indexTest) => {
      const ctx = createContext();
      const userTable = ctx.table('users');

      const { key } = userTable.addRecord({ name: 'Bob', role: 'admin' });
      const record = userTable.getRecord(key);

      indexTest.same(record.name, 'Bob');
      indexTest.same(record.role, 'admin');
      indexTest.end();
    });
    keyTest.end();
  });

  ct.test('addMany', (amTest) => {
    const dataSource = [
      [1, {name: 'Bob', email: 'bob@email.com'}],
      [2, {name: 'Sally', email: 'sally@google.com'}],
    ];

    amTest.test('basic', basicTest => {
      const ctx = createContext();
      const userTable = ctx.table('users');

      const result = userTable.addMany([
        {name: 'Bob', email: 'bob@email.com'},
        {name: 'Sally', email: 'sally@google.com'}
      ]);

      basicTest.same(result, {
        result: new Map(dataSource)
      })

      basicTest.notOk(ctx.lastChange);
      basicTest.end();
    })

    amTest.test('with bad data', (badTest) => {
      const ctx = createContext();
      const users = ctx.table('users',  {
        recordCreator: userCreator
      });

      badTest.throws(() => {
        users.addMany(dataSource);
      }, /no\/bad name/);

      badTest.same(users.collection.size, 0);

      badTest.end();
    });
    amTest.end();


  })

  ct.end();
});
