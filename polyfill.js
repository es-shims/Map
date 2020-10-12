'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	if (typeof Map !== 'function') {
		return implementation;
	}

	var native = Map;

	return native;
};
