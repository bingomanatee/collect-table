/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
import makeContext from "../testHelpers/makeContext.mjs";

const { default: createContext, constants } = pkg;
import deepHome from './../testExpect/deepHome.json' assert { type: 'json' };
import simpleHome from './../testExpect/simpleHome.json' assert { type: 'json' };
import singleRecordGet from './../testExpect/singleRecord.json' assert { type: 'json' };

const { joinFreq, binaryOperator } = constants;

tap.test('queries', (suite) => {
  suite.test('single item', eqTest => {

    const ctx = makeContext(createContext, joinFreq);
    const records = ctx.query({
      tableName: 'users',
      where: {
        field: 'name',
        test: binaryOperator.eq,
        against: 'Bill Smith'
      }
    });


    eqTest.same(records.length, 1);
    eqTest.same(records, singleRecordGet);

    eqTest.end();
  });
  suite.test('regExp match', reTest => {

    const ctx = makeContext(createContext, joinFreq);
    const queryItems = ctx.query({
      tableName: 'users',
      where: {
        field: 'email',
        test: binaryOperator.re,
        against: /@yahoo\.com$/i
      }
    });

    reTest.same(queryItems.length, 3);
    reTest.same(queryItems.map((u) => u.data.name), ['Sal Jones', 'Ellen Fisk', 'Bob NoState']);

    reTest.end();
  });

  suite.test('join', (jTest) => {

    const ctx = makeContext(createContext, joinFreq);

    const records = ctx.query({
      tableName: 'users',
      joins: [
        {
          joinName: 'home',
        }
      ]
    });
    /*
        console.log('==================== simple home query:', JSON.stringify(records)
          .replace(/\{/g, "\n{")
        );
    */

    jTest.same(records, simpleHome);
    jTest.end();
  });
  suite.test('join deep', (jTest) => {

    const ctx = makeContext(createContext, joinFreq);

    const records = ctx.query({
      tableName: 'users',
      joins: [
        {
          joinName: 'home',
          joins: [
            { joinName: 'stateInfo' }
          ]
        }
      ]
    });

/*
    console.log('==================== DEEP home query:', JSON.stringify(records)
      .replace(/\{/g, "\n{")
    );
*/

    jTest.same(records, deepHome);
    jTest.end();
  });
  suite.end();
});
