import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeCart,changeQuantity,cartTotal} from '../src/cart.mjs';
test('restored carts reject malformed quantities and unknown finishes',()=>{assert.deepEqual(sanitizeCart([{id:'bad',qty:3},{id:'chalk',qty:-4},{id:'clay',qty:100}]),[{id:'clay',qty:10}]);assert.deepEqual(sanitizeCart({}),[]);assert.deepEqual(sanitizeCart([{id:'chalk',qty:1.5}]),[])});
test('finish quantities stay independent and totals remain exact',()=>{let c=changeQuantity([],'chalk',2);c=changeQuantity(c,'graphite',3);assert.equal(cartTotal(c),1745);c=changeQuantity(c,'chalk',1);assert.equal(cartTotal(c),1396);c=changeQuantity(c,'graphite',0);assert.deepEqual(c,[{id:'chalk',qty:1}]);assert.equal(cartTotal(c),349)});
