'use strict';

var assert = require('assert');

var P = require('./promise');
var adapter = require('./adapter');

var someRejectionReason = { message: 'some rejection reason' };
var anotherReason = { message: 'another rejection reason' };

describe('mocha promise sanity check', () => {
  it('passes with a resolved promise', () => {
    return P.resolve(3);
  });

  it('passes with a rejected then resolved promise', () => {
    return P.reject(someRejectionReason).catch(x => 'this should be resolved');
  });
});
