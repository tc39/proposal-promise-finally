if (typeof Promise !== 'function') {
	throw new TypeError('A global Promise is required');
}

if (typeof Promise.prototype.finally !== 'function') {
	var speciesConstructor = function (O, defaultConstructor) {
		var C = typeof O.constructor === 'undefined' ? defaultConstructor : O.constructor;
		var S = C[Symbol.species];
		return S == null ?  defaultConstructor : S;
	};
	var shim = {
		finally(onFinally) {
			var handler = typeof onFinally === 'function' ? onFinally : () => {};
			var C = speciesConstructor(this, Promise);
			return this.then(
				x => new C(resolve => resolve(handler())).then(() => x),
				e => new C(resolve => resolve(handler())).then(() => { throw e; })
			);
		}
	};
	Promise.prototype.finally = shim.finally;
}
