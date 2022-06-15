/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
const {default: createContext} = pkg;

tap.test('CollectionTable', (ct) => {

  ct.test('constructor', (conTest) => {

    conTest.test('recordCreator', (rcTest) => {
      const ctx = createContext();
      const users = ctx.table('users',  {
        recordCreator: (table, record) => {
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
        }
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

  ct.end();
});
