'use strict';

var implementation = require('./implementation');

var valueOrFalseIfThrows = function (cb) {
	try {
		return cb();
	} catch (_) {
		return false;
	}
};

// eslint-disable-next-line max-lines-per-function
module.exports = function getPolyfill() {
	if (typeof Map !== 'function') {
		return implementation;
	}

	var newMap = new Map();

	/*
	 *- In Firefox < 19, Map#clear does not exist.
	 *- In Firefox < 23, Map#size is a function.
	 *- In Firefox < 24, Set#entries/keys/values do not exist
	 *- https://bugzilla.mozilla.org/show_bug.cgi?id=869996
	 *- In Firefox 24, Map and Set do not implement forEach
	 *- In Firefox 25 at least, Map and Set are callable without "new"
	 *- In Safari 8, new Map().keys().next is not a function
	 */
	if (
		Map.length !== 0 || typeof Map.prototype.clear !== 'function' || newMap.size !== 0 || typeof Map.prototype.keys !== 'function' || typeof Map.prototype.forEach !== 'function' || typeof newMap.next !== 'function') {
		return implementation;
	}

	// Safari 8, for example, doesn't accept an iterable.
	var mapAcceptsArguments = valueOrFalseIfThrows(function () {
		return new Map([[1, 2]]).get(1) === 2;
	});
	if (!mapAcceptsArguments) {
		return implementation;
	}

	var mapUsesSameValueZero = (function () {
		// Chrome 38-42, node 0.11/0.12, iojs 1/2 also have a bug when the Map has a size > 4
		var m = new Map([
			// eslint-disable-next-line no-magic-numbers
			[1, 0], [2, 0], [3, 0], [4, 0]
		]);
		m.set(-0, m);
		return m.get(0) === m && m.get(-0) === m && m.has(0) && m.has(-0);
	}());
	if (!mapUsesSameValueZero) {
		return implementation;
	}

	var testMap = new Map();
	var mapSupportsChaining = testMap.set(1, 2) === testMap;
	if (!mapSupportsChaining) {
		return implementation;
	}

	// without Object.setPrototypeOf, subclassing is not possible
	if (Object.setPrototypeOf) {
		var mapSupportsSubclassing = valueOrFalseIfThrows(function () {
			var Sub = function Subclass(arg) {
				var o = new Map(arg);
				Object.setPrototypeOf(o, Subclass.prototype);
				return o;
			};
			Object.setPrototypeOf(Sub, Map);
			Object.setPrototypeOf(Sub.prototype, Map.prototype);

			var m = new Sub([]);
			/*
			 * Firefox 32 is ok with the instantiating the subclass but will
			 * throw when the map is used.
			 */
			m.set(1, 1);
			return m instanceof Sub;
		});

		if (!mapSupportsSubclassing) {
			return implementation;
		}
	}

	var mapRequiresNew = (function () {
		try {
			// eslint-disable-next-line new-cap
			return !(Map() instanceof Map);
		} catch (e) {
			return e instanceof TypeError;
		}
	}());
	if (!mapRequiresNew) {
		return implementation;
	}

	var mapIterationThrowsStopIterator = !valueOrFalseIfThrows(function () {
		return new Map().keys().next().done;
	});
	if (!mapIterationThrowsStopIterator) { // Firefox 25
		return implementation;
	}

	return Map;
};
