import Map, * as MapModule from 'es-map';
import test from 'tape';
import runTests from './tests.js';

test('as a function', (t) => {
	console.log(Map);

	runTests(Map, t);

	t.end();
});

test('named exports', async (t) => {
	t.deepEqual(
		Object.keys(MapModule).sort(),
		['default', 'shim', 'getPolyfill', 'implementation'].sort(),
		'has expected named exports',
	);

	const { shim, getPolyfill, implementation } = MapModule;
	t.equal((await import('es-map/shim')).default, shim, 'shim named export matches deep export');
	t.equal((await import('es-map/implementation')).default, implementation, 'implementation named export matches deep export');
	t.equal((await import('es-map/polyfill')).default, getPolyfill, 'getPolyfill named export matches deep export');

	t.end();
});
