'use strict';

const addon = require('.');
const { Counter } = addon;

let passed = 0, failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${label}\n     ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'Assertion failed');
}

console.log('\n── Node-Addon-API addon tests ─────────────────────\n');

// Functions
test('add(2, 3) === 5',           () => assert(addon.add(2, 3) === 5));
test('add(-1, 1) === 0',          () => assert(addon.add(-1, 1) === 0));
test('add(0.1, 0.2) ≈ 0.3',       () => assert(Math.abs(addon.add(0.1, 0.2) - 0.3) < 1e-10));

test('greet returns string',       () => assert(typeof addon.greet('World') === 'string'));
test('greet includes name',        () => assert(addon.greet('Bob').includes('Bob')));

test('fibonacci(0) === 0',         () => assert(addon.fibonacci(0) === 0));
test('fibonacci(1) === 1',         () => assert(addon.fibonacci(1) === 1));
test('fibonacci(10) === 55',       () => assert(addon.fibonacci(10) === 55));
test('fibonacci(20) === 6765',     () => assert(addon.fibonacci(20) === 6765));

test('createPoint returns object', () => assert(typeof addon.createPoint(3, 4) === 'object'));
test('createPoint x/y',            () => { const p = addon.createPoint(3, 4); assert(p.x === 3 && p.y === 4); });
test('createPoint distance = 5',   () => assert(Math.abs(addon.createPoint(3, 4).distanceFromOrigin - 5) < 1e-10));

// Counter (ObjectWrap)
console.log('\n  -- Counter class --');
test('Counter is a function',      () => assert(typeof Counter === 'function'));
test('Counter default value = 0',  () => { const c = new Counter(); assert(c.value === 0); });
test('Counter init value',         () => { const c = new Counter(10); assert(c.value === 10); });
test('increment() +1',             () => { const c = new Counter(); c.increment(); assert(c.value === 1); });
test('increment(5)',               () => { const c = new Counter(); c.increment(5); assert(c.value === 5); });
test('decrement() -1',             () => { const c = new Counter(3); c.decrement(); assert(c.value === 2); });
test('reset()',                    () => { const c = new Counter(9); c.reset(); assert(c.value === 0); });
test('chained ops',                () => {
  const c = new Counter(0);
  c.increment(); c.increment(); c.increment(3); c.decrement();
  assert(c.value === 4);
});

// TypeError tests
test('add bad args throws',        () => { try { addon.add('x', 1); assert(false); } catch (_) {} });
test('fibonacci negative throws',  () => { try { addon.fibonacci(-1); assert(false); } catch (_) {} });

console.log(`\n── ${passed} passed, ${failed} failed ──\n`);
if (failed) process.exit(1);
