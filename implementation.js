'use strict';

var define = require('define-properties');
var callBound = require('call-bind/callBound');
var GetIntrinsic = require('get-intrinsic');
var SameValue = require('es-abstract/2020/SameValue');
var SameValueZero = require('es-abstract/2020/SameValueZero');

var MapEntry = require('./lib/map-entry');
var MapIterator = require('./lib/map-iterator');
var mapHelpers = require('./lib/map-helpers');
var helpers = require('./lib/helpers');
var requireMapSlot = require('./lib/validation').requireMapSlot;
var fastkey = mapHelpers.fastkey;
var mapForEach = mapHelpers.forEach;
var addIterableToMap = mapHelpers.addIterableToMap;
var emptyObject = helpers.emptyObject;
var emulateES6construct = helpers.emulateES6construct;
var addIterator = helpers.addIterator;

var OrigMap = GetIntrinsic('%Map%', true);
var origMapDel = callBound('%Map.prototype.delete%', true);
var origMapGet = callBound('%Map.prototype.get%', true);
var origMapHas = callBound('%Map.prototype.has%', true);
var origMapSet = callBound('%Map.prototype.set%', true);

var MapShimPrototype;
var MapShim = function Map() {
	if (!(this instanceof Map)) {
		throw new TypeError('Constructor Map requires "new"');
	}
	if (this && this['[[es6map]]']) {
		throw new TypeError('Bad construction');
	}
	var map = emulateES6construct(this, Map, MapShimPrototype, {
		'[[es6map]]': true,
		'[[head]]': null,
		'[[map]]': OrigMap ? new OrigMap() : null,
		'[[size]]': 0,
		'[[storage]]': emptyObject()
	});

	var head = new MapEntry(null, null);
	// circular doubly-linked list.
	// eslint-disable-next-line no-multi-assign
	head.next = head.prev = head;
	map['[[head]]'] = head;

	// Optionally initialize map from iterable
	if (arguments.length > 0) {
		addIterableToMap(map, arguments[0]);
	}
	return map;
};
MapShimPrototype = MapShim.prototype;

if (define.supportsDescriptors) {
	Object.defineProperty(MapShimPrototype, 'size', {
		configurable: true,
		enumerable: false,
		get: function () {
			requireMapSlot(this, 'size');
			return this['[[size]]'];
		}
	});
}

/* eslint-disable sort-keys */
define(MapShimPrototype, {
	get: function get(key) {
		requireMapSlot(this, 'get');
		var entry;
		var fkey = fastkey(key, true);
		if (fkey !== null) {
			// fast O(1) path
			entry = this['[[storage]]'][fkey];
			if (entry) {
				return entry.value;
			} else {
				return undefined;
			}
		}
		if (this['[[map]]']) {
			// fast object key path
			entry = origMapGet(this['[[map]]'], key);
			if (entry) {
				return entry.value;
			} else {
				return undefined;
			}
		}
		var head = this['[[head]]'];
		var i = head;
		while ((i = i.next) !== head) {
			if (SameValueZero(i.key, key)) {
				return i.value;
			}
		}

		return undefined;
	},

	has: function has(key) {
		requireMapSlot(this, 'has');
		var fkey = fastkey(key, true);
		if (fkey !== null) {
			// fast O(1) path
			return typeof this['[[storage]]'][fkey] !== 'undefined';
		}
		if (this['[[map]]']) {
			// fast object key path
			return origMapHas(this['[[map]]'], key);
		}
		var head = this['[[head]]'];
		var i = head;
		while ((i = i.next) !== head) {
			if (SameValueZero(i.key, key)) {
				return true;
			}
		}
		return false;
	},

	set: function set(key, value) {
		requireMapSlot(this, 'set');
		var head = this['[[head]]'];
		var i = head;
		var entry;
		var fkey = fastkey(key, true);
		if (fkey !== null) {
			// fast O(1) path
			if (typeof this['[[storage]]'][fkey] === 'undefined') {
				/* eslint-disable-next-line no-multi-assign */
				entry = this['[[storage]]'][fkey] = new MapEntry(key, value);
				i = head.prev;
				// fall through
			} else {
				this['[[storage]]'][fkey].value = value;
				return this;
			}
		} else if (this['[[map]]']) {
			// fast object key path
			if (origMapHas(this['[[map]]'], key)) {
				origMapGet(this['[[map]]'], key).value = value;
			} else {
				entry = new MapEntry(key, value);
				origMapSet(this['[[map]]'], key, entry);
				i = head.prev;
				// fall through
			}
		}
		while ((i = i.next) !== head) {
			if (SameValueZero(i.key, key)) {
				i.value = value;
				return this;
			}
		}
		entry = entry || new MapEntry(key, value);
		if (SameValue(-0, key)) {
			entry.key = +0; // coerce -0 to +0 in entry
		}
		entry.next = this['[[head]]'];
		entry.prev = this['[[head]]'].prev;
		entry.prev.next = entry;
		entry.next.prev = entry;
		this['[[size]]'] += 1;
		return this;
	},

	'delete': function (key) {
		requireMapSlot(this, 'delete');
		var head = this['[[head]]'];
		var i = head;
		var fkey = fastkey(key, true);
		if (fkey !== null) {
			// fast O(1) path
			if (typeof this['[[storage]]'][fkey] === 'undefined') {
				return false;
			}
			i = this['[[storage]]'][fkey].prev;
			delete this['[[storage]]'][fkey];
			// fall through
		} else if (this['[[map]]']) {
			// fast object key path
			if (!origMapHas(this['[[map]]'], key)) {
				return false;
			}
			i = origMapGet(this['[[map]]'], key).prev;
			origMapDel(this['[[map]]'], key);
			// fall through
		}
		while ((i = i.next) !== head) {
			if (SameValueZero(i.key, key)) {
				i.key = MapEntry.empty;
				i.value = MapEntry.empty;
				i.prev.next = i.next;
				i.next.prev = i.prev;
				this['[[size]]'] -= 1;
				return true;
			}
		}
		return false;
	},

	clear: function clear() {
		requireMapSlot(this, 'clear');
		this['[[map]]'] = OrigMap ? new OrigMap() : null;
		this['[[size]]'] = 0;
		this['[[storage]]'] = emptyObject();
		var head = this['[[head]]'];
		var i = head;
		var p = i.next;
		while ((i = p) !== head) {
			i.key = MapEntry.empty;
			i.value = MapEntry.empty;
			p = i.next;
			/* eslint-disable-next-line no-multi-assign */
			i.next = i.prev = head;
		}
		/* eslint-disable-next-line no-multi-assign */
		head.next = head.prev = head;
	},

	keys: function keys() {
		requireMapSlot(this, 'keys');
		return new MapIterator(this, 'key');
	},

	values: function values() {
		requireMapSlot(this, 'values');
		return new MapIterator(this, 'value');
	},

	entries: function entries() {
		requireMapSlot(this, 'entries');
		return new MapIterator(this, 'key+value');
	},

	forEach: function forEach(fn) {
		requireMapSlot(this, 'set');
		mapForEach(this, fn, arguments.length > 1 ? arguments[1] : void 0);
	}
});

addIterator(MapShimPrototype, MapShimPrototype.entries);

module.exports = MapShim;
