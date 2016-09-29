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

describe('onFinally', () => {
	describe('no callback', () => {
		specify('from resolved', () => {
			return adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally()
				.then(function onFulfilled(x) {
					assert.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', () => {
			return adapter.rejected(someRejectionReason)
				.catch((e) => {
					assert.strictEqual(e, someRejectionReason);
					throw e;
				})
				.finally()
				.then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					assert.strictEqual(reason, someRejectionReason);
				});
		});
	});

	describe('throws an exception', () => {
		specify('from resolved', () => {
			return adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					assert.strictEqual(reason, someRejectionReason);
				});
		});

		specify('from rejected', () => {
			return adapter.rejected(anotherReason).finally(function onFinally() {
				assert(arguments.length === 0);
				throw someRejectionReason;
			}).then(function onFulfilled() {
				throw new Error('should not be called');
			}, function onRejected(reason) {
				assert.strictEqual(reason, someRejectionReason);
			});
		});
	});

	describe('returns a non-promise', () => {
		specify('from resolved', () => {
			return adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					return 4;
				}).then(function onFulfilled(x) {
					assert.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', () => {
			return adapter.rejected(anotherReason)
				.catch((e) => {
					assert.strictEqual(e, anotherReason);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns a pending-forever promise', () => {
		specify('from resolved', (done) => {
			adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new P(() => {}); // forever pending
				}).then(function onFulfilled(x) {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', (done) => {
			adapter.rejected(someRejectionReason)
				.catch((e) => {
					assert.strictEqual(e, someRejectionReason);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new P(() => {}); // forever pending
				}).then(function onFulfilled(x) {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});
	});

	describe('returns an immediately-fulfilled promise', () => {
		specify('from resolved', () => {
			return adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					return adapter.resolved(4);
				}).then(function onFulfilled(x) {
					assert.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', () => {
			return adapter.rejected(someRejectionReason)
				.catch((e) => {
					assert.strictEqual(e, someRejectionReason);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					return adapter.resolved(4);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns an immediately-rejected promise', () => {
		specify('from resolved ', () => {
			return adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					return adapter.rejected(4);
				}).then(function onFulfilled(x) {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, 4);
				});
		});

		specify('from rejected', () => {
      const newReason = {};
			return adapter.rejected(someRejectionReason)
				.catch((e) => {
					assert.strictEqual(e, someRejectionReason);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					return adapter.rejected(newReason);
				}).then(function onFulfilled(x) {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, newReason);
				});
		});
	});

	describe('returns a fulfilled-after-a-second promise', () => {
		specify('from resolved', (done) => {
			adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new P((resolve) => {
						setTimeout(() => resolve(4), 1e3);
					});
				}).then(function onFulfilled(x) {
					assert.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', (done) => {
			adapter.rejected(3)
				.catch((e) => {
					assert.strictEqual(e, 3);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new P((resolve) => {
						setTimeout(() => resolve(4), 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, 3);
				});
		});
	});

	describe('returns a rejected-after-a-second promise', () => {
		specify('from resolved', (done) => {
			adapter.resolved(3)
				.then((x) => {
					assert.strictEqual(x, 3);
					return x;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new P((resolve, reject) => {
						setTimeout(() => reject(4), 1e3);
					});
				}).then(function onFulfilled(x) {
					assert.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', (done) => {
			adapter.rejected(someRejectionReason)
				.catch((e) => {
					assert.strictEqual(e, someRejectionReason);
					throw e;
				})
				.finally(function onFinally() {
					assert(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new P((resolve, reject) => {
						setTimeout(() => reject(anotherReason), 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					assert.strictEqual(e, anotherReason);
				});
		});
	});
});
