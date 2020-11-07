'use strict';

require('../shim')();

var test = require('tape');

var runTests = require('./tests');

test('shimmed', function (t) {
	runTests(Map, t);

	t.end();
});
