'use strict';

require('../shim')();

var test = require('tape');

/*
 * These delete are necessary because es-get-iterator (used by the array.from polyfill)
 * only works when it's required _after_ shimming the Map.
 */
delete require.cache[process.cwd() + '/node_modules/is-map/index.js'];
delete require.cache[process.cwd() + '/node_modules/es-get-iterator/node_modules/es-abstract/helpers/callBound.js'];
delete require.cache[process.cwd() + '/node_modules/es-get-iterator/node_modules/es-abstract/GetIntrinsic.js'];
delete require.cache[process.cwd() + '/node_modules/es-get-iterator/index.js'];
delete require.cache[process.cwd() + '/node_modules/iterate-values/index.js'];
delete require.cache[process.cwd() + '/node_modules/array.from/implementation.js'];
delete require.cache[process.cwd() + '/node_modules/array.from/index.js'];
var ArrayFrom = require('array.from');

var runTests = require('./tests');

test('shimmed', function (t) {
	runTests(Map, t);

	// This test only works when the polyfill is applied globally
	t.test('should have an iterator that works with polyfilled Array.from', { skip: true }, function (st) {
		var map = new Map();

		st.equal(map.set('a', 1), map, 'add "a"->1 to map');
		st.equal(map.set('b', NaN), map, 'add "b"->NaN to map');
		st.equal(map.set('c', false), map, 'add "c"->false to map');
		st.deepEqual(ArrayFrom(map), [['a', 1], ['b', NaN], ['c', false]], 'Array.from(map) returns the entries');

		// These don't work with es-get-iterator
		st.deepEqual(ArrayFrom(map.keys()), ['a', 'b', 'c'], 'Array.from(map.keys()) returns the keys');
		st.deepEqual(ArrayFrom(map.values()), [1, NaN, false], 'Array.from(map.values()) returns the values');
		st.deepEqual(ArrayFrom(map.entries()), [['a', 1], ['b', NaN], ['c', false]], 'Array.from(map.entries()) returns the entries');

		st.end();
	});

	t.end();
});
