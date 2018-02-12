if (typeof Promise !== 'function') {
	throw new TypeError('A global Promise is required');
}

if (typeof Promise.prototype.finally !== 'function') {
	Object.defineProperty(Promise.prototype, 'finally', {
		configurable: true,
		writable: true,
		value(onFinally) {
			var promise = this;
			if (typeof promise !== 'object' || promise === null) {
				throw new TypeError('"this" value is not an Object');
			}
			if (typeof onFinally !== 'function') {
				return Promise.prototype.then.call(promise, onFinally, onFinally);
			}
			var threw = false;
			var result;
			return Promise.prototype.then.call(
				promise,
				function (x) {
					result = x;
					return onFinally();
				},
				function (e) {
					threw = true;
					result = e;
					return onFinally();
				}
			).then(function () {
				if (threw) {
					throw result;
				}
				return result;
			});
		}
	});
}
