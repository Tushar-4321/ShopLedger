'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('inventory check allows buying exactly all sellable units', () => {
  const products = [{ id: 1, name: 'Tea', stock: 5, reserved: 2 }];

  assert.equal(inventory.getSellableStock(products[0]), 3);
  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 3 }]), { ok: true });
});

test('inventory check allows quantities below sellable stock', () => {
  const products = [{ id: 1, name: 'Tea', stock: 5, reserved: 2 }];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 2 }]), { ok: true });
});

test('cancelling an order restores its items to physical stock', () => {
  const db = {
    nextOrderId: 1002,
    products: [{ id: 1, name: 'Tea', stock: 3, reserved: 1 }],
    orders: [{
      id: 1001,
      status: 'completed',
      paymentMode: 'cash',
      items: [{ id: 1, qty: 2 }],
      total: 10
    }]
  };

  const result = orders.cancel(db, 1001, 'test cancellation');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[0].reserved, 1);
});

test('inventory release restores stock for the order item shape', () => {
  const products = [{ id: 1, name: 'Tea', stock: 3, reserved: 2 }];

  inventory.release(products, [{ id: 1, qty: 1 }]);

  assert.equal(products[0].stock, 4);
  assert.equal(products[0].reserved, 2);
});
