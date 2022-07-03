/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
import makeContext from "../testHelpers/makeContext.mjs";
import linkableContext from '../testHelpers/linkableContent.mjs';

const { default: createContext, constants } = pkg;
import deepHome from './../testExpect/deepHome.json' assert { type: 'json' };
import simpleHome from './../testExpect/simpleHome.json' assert { type: 'json' };
import singleRecordGet from './../testExpect/singleRecord.json' assert { type: 'json' };
import stateRS from './../testExpect/states.json' assert { type: 'json' };
import deepStateRS from './../testExpect/deepStates.json' assert { type: 'json' };
import userHats from './../testExpect/joinedHats.json' assert { type: 'json' };

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


    /*    console.log('==================== DEEP home query:', JSON.stringify(records)
          .replace(/\{/g, "\n{")
        );*/


    jTest.same(records, deepHome);
    jTest.end();
  });

  suite.test('toMany', (tm) => {

    const ctx = makeContext(createContext, joinFreq);
    const records = ctx.query({
      tableName: 'states',
      joins: [
        { joinName: 'stateInfo' }
      ]
    });
    // console.log('==================== state query:', JSON.stringify(records)
    //   .replace(/\{/g, "\n{")
    // );

    tm.same(records, stateRS);


    tm.end();
  });

  suite.test('toMany - deep', (tmDeep) => {

    const ctx = makeContext(createContext, joinFreq);
    const records = ctx.query({
      tableName: 'states',
      joins: [
        { joinName: 'stateInfo', joins: [{ joinName: 'home' }] }
      ]
    });
    /*   console.log('==================== state query DEEP:', JSON.stringify(records)
         .replace(/\{/g, "\n{")
       );*/

    tmDeep.same(records, deepStateRS);

    tmDeep.end();
  });

  suite.test('m2m joins', (m2m) => {

    const ctx = linkableContext(createContext, joinFreq);
    const [dave] = ctx.query({
      tableName: 'users',
      where: {
        field: 'name', test: binaryOperator.eq, against: 'Dave Clark'
      }
    });

    const [whiteHat] = ctx.query({
      tableName: 'hats',
      where: {
        field: 'name', test: binaryOperator.eq, against: 'white hat'
      }
    });

    ctx.table('users').join(new Map([[dave, whiteHat]]), 'userHats');

    // console.log('userHats is now ', ctx.table('user_hats').data.items);

    const joined = ctx.table('users').query({
      tableName: 'users',
      joins: [
        {
          joinName: 'userHats'
        }
      ]
    });

/*
    console.log('==================== Joined Hats:', JSON.stringify(joined)
      .replace(/\{/g, "\n{")
    );*/

    m2m.same(joined, userHats);
    m2m.end();
  })

  suite.end();
});
