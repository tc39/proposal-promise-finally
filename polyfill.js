if (typeof Promise !== 'function') {
	throw new TypeError('A global Promise is required');
}

if (typeof Promise.prototype.finally !== 'function') {
	var speciesConstructor = function (O, defaultConstructor) {
		var C = typeof O.constructor === 'undefined' ? defaultConstructor : O.constructor;
		var S = C[Symbol.species];
		return S == null ?  defaultConstructor : S;
	};
	Promise.prototype.finally = function finally(onFinally) {
		var handler = typeof onFinally === 'function' ? onFinally : () => {};
		var C = speciesConstructor(this, Promise);
		return this.then(
			x => C.resolve(onFinally()).then(() => x),
			e => C.resolve(onFinally()).then(() => throw e)
		});
	});
}
