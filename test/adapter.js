var P = require('./promise');

module.exports = {
	resolved(x) { return P.resolve(x); },
	rejected(e) { return P.reject(e); },
	deferred() {
		var deferred = {};
		deferred.promise = new P((resolve, reject) => {
			deferred.resolve = resolve;
			deferred.reject = reject;
		});
		return deferred;
	}
};
