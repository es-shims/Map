import callBind from 'es-abstract/helpers/callBind.js';

import getPolyfill from 'es-map/polyfill';

export default callBind(getPolyfill(), String);

export { default as getPolyfill } from 'es-map/polyfill';
export { default as implementation } from 'es-map/implementation';
export { default as shim } from 'es-map/shim';
