'use strict';

var define = require('define-properties');
var globalThis = require('globalthis')();
var getPolyfill = require('./polyfill');

module.exports = function shimStringRaw() {
	var polyfill = getPolyfill();
	define(
		globalThis,
		{ Map: polyfill },
		{ Map: function () { return typeof Map !== 'function' || Map !== polyfill; } }
	);
	return polyfill;
};
