/* eslint-disable @typescript-eslint/ban-ts-ignore */
import tap from 'tap';
import pkg from '../dist/index.js';
import makeContext from "./testHelpers/makeContext.mjs";

const {
  default: createContext,
  DataSet,
  constants: {
    joinFreq
  },
  dataSetJoinReducer,
  TableRecordJoin,
} = pkg;
const {
  default: dsjr,
  recordsForJoin,
  keysForJoin,
} = dataSetJoinReducer;

tap.test('dataSetJoinReducer', suite => {

  suite.test('keysForJoin', (kfj) => {
    kfj.test('1-1', (kfh11) => {

      const ctx = makeContext(createContext, joinFreq);
      const ds = new DataSet({
        sourceTable: 'users',
        context: ctx
      });

      const query = {
        tableName: 'users',
        joins: [
          { joinName: 'home' }
        ]
      };

      const helper = new TableRecordJoin(ctx, query.joins[0], query);

      const addrKeys = keysForJoin(helper, ds, query);

      const data = addrKeys.data;

      data.store.forEach((keys, key) => {
        const user = ctx.table('users').getData(key);
        if (user.addID) {
          kfh11.same(user.addID, keys[0]);
        } else {
          kfh11.same(keys, []);
        }
      });
      kfh11.end();
    })
    kfj.test('1-m', (kfh1m) => {

      const ctx = makeContext(createContext, joinFreq);
      const ds = new DataSet({
        sourceTable: 'state',
        context: ctx
      });

      const query = {
        tableName: 'states',
        joins: [
          { joinName: 'stateInfo' }
        ]
      };

      const helper = new TableRecordJoin(ctx, query.joins[0], query);

      const addrKeys = keysForJoin(helper, ds, query);

      const data = addrKeys.data;

      data.store.forEach((keys, key) => {
        const state = ctx.table('states').getData(key);
        keys.forEach((key) => {
          const addr = ctx.table('addr').getData(key);
          kfh1m.same(addr.state, state.code);
        });
      });
      kfh1m.end();
    })

    kfj.end();
  });

  suite.test('recordsForJoin', (rfj) => {
    rfj.test('1-m', (rfj1m) => {

      const ctx = makeContext(createContext, joinFreq);
      const ds = new DataSet({
        sourceTable: 'states',
        context: ctx
      });

      const query = {
        tableName: 'states',
        joins: [
          { joinName: 'stateInfo' }
        ]
      };

      const helper = new TableRecordJoin(ctx, query.joins[0], query);
      const stateKeys = keysForJoin(helper, ds, query);

      const addresses = recordsForJoin(helper, stateKeys.data, ctx);

      const addressesWithoutStore = ctx.table('addr').data.cloneShallow()
        .filter((addr) => !!addr.state);
      // all addresses except the one with no state are cached
      rfj1m.same(new Set(addressesWithoutStore.store.items), new Set(addresses.values));
      rfj1m.end();
    })
    rfj.test('1-1', (rfj11) => {

      const ctx = makeContext(createContext, joinFreq);
      const ds = new DataSet({
        sourceTable: 'users',
        context: ctx
      });

      const query = {
        tableName: 'users',
        joins: [
          { joinName: 'home' }
        ]
      };

      const helper = new TableRecordJoin(ctx, query.joins[0], query);

      const stateKeys = keysForJoin(helper, ds, query);

      const addresses = recordsForJoin(helper, stateKeys.data, ctx);
      const addressesWithoutStore = ctx.table('addr').data.cloneShallow().filter((item) => item.id !== 5);

      // all addresses except the one without a user association
      rfj11.same(new Set(addressesWithoutStore.items), new Set(addresses.data.items));
      rfj11.end();
    })

    rfj.end();
  });

  suite.test('dataSetReducer', (dsr) => {

    const ctx = makeContext(createContext, joinFreq);

    const query = {
      tableName: 'users',
      joins: [
        { joinName: 'home' }
      ]
    };

    const reducer = dsjr(query);

    const ds = new DataSet({
      sourceTable: 'users',
      context: ctx,
      reducer
    });

    console.log("dataset value:", JSON.stringify(ds.value.items));

    dsr.same(new Set(ds.value.items), new Set(
      [{
        "name": "Bill Smith",
        "email": "bill@google.com",
        "addID": 1,
        "home": [{
          "tableName": "addr",
          "key": 1,
          "data": { "id": 1, "addr": "111 First Street", "state": "CA", "country": "US", "postcode": 12345 }
        }]
      }, {
        "name": "Sal Jones",
        "email": "sal@yahoo.com",
        "addID": 3,
        "home": [{
          "tableName": "addr",
          "key": 3,
          "data": { "id": 3, "addr": "333 Trinity Ave", "state": "OR", "country": "US", "postcode": 72332 }
        }]
      }, { "name": "Dave Clark", "email": "nosferatu@transylvania.com", "home": [] }, {
        "name": "Ellen Fisk",
        "email": "ellen@yahoo.com",
        "addID": 2,
        "home": [{
          "tableName": "addr",
          "key": 2,
          "data": { "id": 2, "addr": "20 Broadway Ave", "country": "US", "state": "CA", "postcode": 40443 }
        }]
      }, {
        "name": "Bob NoState",
        "email": "bob@yahoo.com",
        "addID": 4,
        "home": [{ "tableName": "addr", "key": 4, "data": { "id": 4, "addr": "100 noState Lane", "postcode": 123213 } }]
      }]
    ))

    dsr.end();
  });

  suite.end();
})
