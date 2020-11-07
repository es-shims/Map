'use strict';

var define = require('define-properties');
var hasSymbols = require('has-symbols')();

var GetIntrinsic = require('es-abstract/GetIntrinsic');
var CreateIterResultObject = require('es-abstract/2020/CreateIterResultObject');
var OrdinaryObjectCreate = require('es-abstract/2020/OrdinaryObjectCreate');

var requireMapSlot = require('./validation').requireMapSlot;
var addIterator = require('./helpers').addIterator;

var MapIterator = function MapIterator(map, kind) {
	requireMapSlot(map, '[[MapIterator]]');
	// eslint-disable-next-line no-multi-assign
	this['[[i]]'] = this['[[head]]'] = map['[[head]]'];
	this['[[kind]]'] = kind;
};

var IteratorPrototype = GetIntrinsic('%IteratorPrototype%', true);
if (IteratorPrototype) {
	MapIterator.prototype = OrdinaryObjectCreate(IteratorPrototype);
}
addIterator(MapIterator.prototype);

define(MapIterator.prototype, {
	'[[isMapIterator]]': true,

	next: function next() {
		if (!this['[[isMapIterator]]']) {
			throw new TypeError('Not a MapIterator');
		}
		var i = this['[[i]]'];
		var kind = this['[[kind]]'];
		var head = this['[[head]]'];
		if (typeof i === 'undefined') {
			return CreateIterResultObject(void 0, true);
		}
		while (i.isRemoved() && i !== head) {
			// back up off of removed entries
			i = i.prev;
		}
		// advance to next unreturned element.
		var result;
		while (i.next !== head) {
			i = i.next;
			if (!i.isRemoved()) {
				if (kind === 'key') {
					result = i.key;
				} else if (kind === 'value') {
					result = i.value;
				} else {
					result = [i.key, i.value];
				}
				this['[[i]]'] = i;
				return CreateIterResultObject(result, false);
			}
		}
		// once the iterator is done, it is done forever.
		this['[[i]]'] = void 0;
		return CreateIterResultObject(void 0, true);
	}
});

if (hasSymbols && Symbol.toStringTag) {
	Object.defineProperty(MapIterator.prototype, Symbol.toStringTag, {
		configurable: true,
		enumerable: false,
		value: 'Map Iterator',
		writable: false
	});
}

module.exports = MapIterator;
