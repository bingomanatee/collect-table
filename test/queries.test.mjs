/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import { createBase, constants } from '../dist/carpenter.es.js';
import initTestBase from "../testHelpers/initTestBase.mjs";
import linkableContext from '../testHelpers/linkableContent.mjs';
import petsAndOwners from '../testHelpers/pets_and_owners.mjs';
import deepHome from './../testExpect/deepHome.json' assert { type: 'json' };
import simpleHome from './../testExpect/simpleHome.json' assert { type: 'json' };
import singleRecordGet from './../testExpect/singleRecord.json' assert { type: 'json' };
import stateRS from './../testExpect/states.json' assert { type: 'json' };
import deepStateRS from './../testExpect/deepStates.json' assert { type: 'json' };
import userHats from './../testExpect/joinedHats.json' assert { type: 'json' };

const { joinFreq, binaryOperator } = constants;

tap.test('queries', (suite) => {
  suite.test('single item', eqTest => {

    const testBase = initTestBase(createBase, joinFreq);
    const records = testBase.query({
      tableName: 'users',
      where: {
        field: 'name',
        test: binaryOperator.eq,
        against: 'Bill Smith'
      }
    }).map(r => r.value);


    eqTest.same(records.length, 1);
    eqTest.same(records, singleRecordGet);

    eqTest.end();
  });
  suite.test('regExp match', reTest => {

    const testBase = initTestBase(createBase, joinFreq);
    const queryItems = testBase.query({
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


  suite.test('function match', reTest => {

    const base = initTestBase(createBase, joinFreq);
    const queryItems = base.query({
      tableName: 'users',
      where: (record) => {
        return !(record.key % 2);
      }
    });

    reTest.same(queryItems.length, 2);
    reTest.same(queryItems.map((u) => u.key), [2, 4]);

    reTest.end();
  });

  suite.test('join', (jTest) => {

    const testBase = initTestBase(createBase, joinFreq);

    // console.log('----------- simple home query --------------')
    const records = testBase.query({
      tableName: 'users',
      joins: [
        {
          joinName: 'home',
        }
      ]
    })
    /*
            console.log('==================== simple home query:', JSON.stringify(records)
              .replace(/\{/g, "\n{")
            );
    */
    // console.log('--- simple home query result:', records.map(r => r.valueWithID));
    jTest.same(records.map(r => r.value), simpleHome);
    jTest.end();
  });
  suite.test('join deep', (jTest) => {

    const testBase = initTestBase(createBase, joinFreq);

    const records = testBase.query({
      tableName: 'users',
      joins: [
        {
          joinName: 'home',
          joins: [
            { joinName: 'stateInfo' }
          ]
        }
      ]
    }).map(r => r.value);


    /*    console.log('==================== DEEP home query:', JSON.stringify(records)
          .replace(/\{/g, "\n{")
        );*/


    jTest.same(records, deepHome);
    jTest.end();
  });

  suite.test('toMany', (tm) => {

    const testBase = initTestBase(createBase, joinFreq);
    // console.log('------ toMany test --------');
    const records = testBase.query({
      tableName: 'states',
      joins: [
        { joinName: 'stateInfo' }
      ]
    });
    // console.log('==================== state query:', JSON.stringify(records.map(r => r.valueWithID))
    //   .replace(/\{/g, "\n{")
    // );
    // console.log('toMany test done');
    tm.same(records.map(r => r.value), stateRS);
    tm.same(records.map(r => r.value), stateRS);


    tm.end();
  });

  suite.test('toMany - deep', (tmDeep) => {
    const testBase = initTestBase(createBase, joinFreq);
    // console.log('-----  deepState');
    const records = testBase.query({
      tableName: 'states',
      joins: [
        { joinName: 'stateInfo', joins: [{ joinName: 'home' }] }
      ]
    })
    /* console.log('----- end deepState');

     console.log('==================== deepState:');
     console.log(JSON.stringify(records.map(r => r.valueWithID))
       .replace(/\{/g, "\n{")
     );*/
    tmDeep.same(records.map(r => r.value), deepStateRS);

    tmDeep.end();
  });

  suite.test('fk joins - large data set', (lds) => {
    const base = petsAndOwners(createBase, joinFreq);

    const start = Date.now();
    const owners = base.query({
      tableName: 'people',
      joins: [
        {
          joinName: 'owned pets'
        }
      ]
    })
    console.log('large query took', Date.now() - start, 'ms');
    console.log('owners:', owners.length, 'lines');
    console.log('people:', base.table('people').data.size, 'records');
    console.log('pets:', base.table('pets').data.size, 'records');
    lds.end();
  });

  suite.test('m2m joins', (m2m) => {
    const testBase = linkableContext(createBase, joinFreq);
    const [dave] = testBase.query({
      tableName: 'users',
      where: {
        field: 'name', test: binaryOperator.eq, against: 'Dave Clark'
      }
    })

    const [whiteHat] = testBase.query({
      tableName: 'hats',
      where: {
        field: 'name', test: binaryOperator.eq, against: 'white hat'
      }
    })

    testBase.table('users').join(new Map([[dave, whiteHat]]), 'userHats');

    const joined = testBase.table('users').query({
      tableName: 'users',
      joins: [
        {
          joinName: 'userHats'
        }
      ]
    }).map(r => r.value)

    /*    console.log('==================== FOUND Joined Hats:', JSON.stringify(joined)
          .replace(/\{/g, "\n{")
        );
        console.log('==================== Joined Hats:', JSON.stringify(userHats)
          .replace(/\{/g, "\n{")
        );*/

    m2m.same(joined, userHats);
    m2m.end();
  })

  suite.end();
});
