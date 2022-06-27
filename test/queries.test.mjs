/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
import makeContext from "./testHelpers/makeContext.mjs";
const { default: createContext, constants } = pkg;

const {joinFreq, binaryOperator} = constants;

tap.test('queries', (suite) => {
  const ctx = makeContext(createContext, joinFreq);
  suite.test(eqTest => {

      const queryItems = ctx.query({
        tableName: 'users',
        where: {
          field: 'name',
          test: binaryOperator.eq,
          against: 'Bill Smith'
        }
      });

      eqTest.same(queryItems.data.size, 1);
      eqTest.same(queryItems.data.items, [{
        name: 'Bill Smith',
        email: 'bill@google.com',
        addID: 1,
      }]);

      eqTest.end();
    });
  suite.test(reTest => {

      const queryItems = ctx.query({
        tableName: 'users',
        where: {
          field: 'email',
          test: binaryOperator.re,
          against: /@yahoo\.com$/i
        }
      });

      reTest.same(queryItems.data.size, 3);
      reTest.same(queryItems.data.items.map((u) => u.name), ['Sal Jones', 'Ellen Fisk', 'Bob NoState']);

      reTest.end();
    });
  suite.end();
});
