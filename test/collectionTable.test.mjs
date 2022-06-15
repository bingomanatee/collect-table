/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
const {default: createContext} = pkg;

console.log('createContext:', createContext);

tap.test('CollectionTable', (ct) => {

  ct.test('constructor', (conTest) => {

    conTest.test('recordCreator', (rcTest) => {
      const ctx = createContext();
      const users = ctx.table('users',  {
        recordCreator: (table, data) => {
          console.log('recordCreator -- testing data', data);
          if (!((typeof data.name === 'string' ) && /^[\w ]{4,}$/.test(data.name))) {
            throw new Error('no/bad name');
          }
          if (!((typeof data.email === 'string') && /^.+@.+\..+$/.test(data.email))) {
            throw new Error('no/bad email');
          }
          return {
            name: data.name,
            email: data.email
          }
        }
      });

      const userRecord = users.addRecord({name: 'Bob Smith', email: 'bob@foo.com', junk: 'data'});
      rcTest.same(userRecord.data, {name: 'Bob Smith', email: 'bob@foo.com'});
      rcTest.end();
    })

    conTest.end();
  });

  ct.test('get/addRecord', (keyTest) => {
    keyTest.test('should create, get record value', (indexTest) => {
      const ctx = createContext();

      const userTable = ctx.table('users');
      const { key } = userTable.addRecord({ name: 'Bob', role: 'admin' });

      const { data: user } = userTable.getRecord(key);

      indexTest.same(user.name, 'Bob');
      indexTest.same(user.role, 'admin');
      indexTest.end();
    });
    keyTest.end();
  });

  ct.end();
});
