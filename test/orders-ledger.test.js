'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function ledgerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }]
  };
}

function datedOrders() {
  return {
    orders: [
      { id: 1008, date: '15/03/2022' },
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' }
    ]
  };
}

test('orders.list sorts mixed dates newest first by real date', () => {
  const result = orders.list(datedOrders());

  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);
});

test('orders.list filters DD/MM/YYYY dates correctly from YYYY-MM-DD picker values', () => {
  const result = orders.list(datedOrders(), {
    from: '2022-02-01',
    to: '2022-03-31'
  });

  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022'
  ]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts ISO dates to DD/MM/YYYY text', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.equal(dates.normalizeDateKey('15/03/2022'), '15/03/2022');
});

test('CURRENT BEHAVIOUR: numeric settlement amount updates totalSettled and balance numerically', () => {
  const db = ledgerDb();

  const result = ledger.recordSettlement(db, 1, 500, 'upi', 'numeric payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('recordSettlement treats a numeric string amount as a number', () => {
  const db = ledgerDb();

  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'JSON string payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero settlement amount is rejected without changing the customer', () => {
  const db = ledgerDb();

  const result = ledger.recordSettlement(db, 1, 0);

  assert.deepEqual(result, {
    ok: false,
    error: 'Settlement amount must be greater than zero'
  });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: negative settlement amount is rejected without changing the customer', () => {
  const db = ledgerDb();

  const result = ledger.recordSettlement(db, 1, -25);

  assert.deepEqual(result, {
    ok: false,
    error: 'Settlement amount must be greater than zero'
  });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('recordSettlement rejects a non-numeric amount without changing the customer', () => {
  const db = ledgerDb();

  const result = ledger.recordSettlement(db, 1, 'not-a-number');

  assert.deepEqual(result, {
    ok: false,
    error: 'Settlement amount must be greater than zero'
  });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('correct behaviour: orders use real dates and settlements use validated numeric amounts', () => {
  const db = datedOrders();
  const newestFirst = orders.list(db).map((order) => order.date);
  assert.deepEqual(newestFirst, [
    '15/03/2022',
    '30/01/2022',
    '28/12/2021'
  ]);

  const inRange = orders.list(db, {
    from: '2022-02-01',
    to: '2022-03-31'
  }).map((order) => order.date);
  assert.deepEqual(inRange, ['15/03/2022']);

  const customerDb = ledgerDb();
  const settlement = ledger.recordSettlement(customerDb, 1, '500', 'upi');
  assert.equal(settlement.ok, true);
  assert.equal(settlement.customer.totalSettled, 1700);
  assert.equal(settlement.customer.balance, 732.01);
  assert.equal(settlement.settlement.amount, 500);

  const invalid = ledger.recordSettlement(customerDb, 1, 'not-a-number', 'upi');
  assert.equal(invalid.ok, false);
  assert.equal(customerDb.customers[0].totalSettled, 1700);
  assert.equal(customerDb.customers[0].balance, 732.01);
  assert.equal(customerDb.settlements.length, 1);
});
