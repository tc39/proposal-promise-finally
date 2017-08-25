global.foo = 0;
global.id = 1;
const {
	Call,
	Get,
	Invoke,
	IsCallable,
	IsConstructor,
	SameValue,
	SpeciesConstructor,
	Type,
} = require('especially/abstract-operations');
const {
	assert,
	get_slot,
	has_slot,
	make_slots,
	set_slot,
} = require('especially/meta');
const { '@@species': atAtSpecies } = require('especially/well-known-symbols');

const {
	PromiseIntrinsic,
	NewPromiseCapability,
	IsPromise,
} = require('./promiseSpec');

Object.assign(PromiseIntrinsic.prototype, {
	finally(onFinally) {
		const promise = this;
		if (IsPromise(this) === false) {
			throw new TypeError('Promise.prototype.finally only works on real promises');
		}

		const C = SpeciesConstructor(promise, PromiseIntrinsic);
		assert(IsConstructor(C));

		let thenFinally, catchFinally;
		if (IsCallable(onFinally) !== true) {
			thenFinally = onFinally;
			catchFinally = onFinally;
		} else {
			thenFinally = new ThenFinallyFunction();
			catchFinally = new CatchFinallyFunction();

			set_slot(thenFinally, 'Constructor', C);
			set_slot(catchFinally, 'Constructor', C);

			set_slot(thenFinally, 'OnFinally', onFinally);
			set_slot(catchFinally, 'OnFinally', onFinally);
		}

		return Invoke(promise, 'then', [thenFinally, catchFinally]);
	}
});
Object.defineProperty(PromiseIntrinsic.prototype, 'finally', {
	enumerable: false,
});
Object.assign(PromiseIntrinsic, {
	resolve(x) {
		let C = this;

		if (Type(C) !== 'Object') {
			throw new TypeError('Promise.all must be called on an object');
		}

		return PromiseResolve(C, x);
	}
});

function PromiseResolve(C, x) {
	assert(Type(C) === 'Object');

	if (IsPromise(x) === true) {
		const xConstructor = Get(x, 'constructor');
		if (SameValue(xConstructor, C) === true) {
			return x;
		}
	}

	const promiseCapability = NewPromiseCapability(C);
	Call(get_slot(promiseCapability, '[[Resolve]]'), undefined, [x]);
	return get_slot(promiseCapability, '[[Promise]]');
}

function ThenFinallyFunction() {
	const ThenFinally = (value) => {
		const onFinally = get_slot(ThenFinally, 'OnFinally');
		assert(IsCallable(onFinally));

		const result = onFinally();

		const C = get_slot(ThenFinally, 'Constructor');
		assert(IsConstructor(C));

		const promise = PromiseResolve(C, result);
		const valueThunk = () => value;
		return Invoke(promise, 'then', [valueThunk]);
	};

	make_slots(ThenFinally, [
		'OnFinally',
		'Constructor',
	]);

	return ThenFinally;
}

function CatchFinallyFunction() {
	const CatchFinally = (reason) => {
		const onFinally = get_slot(CatchFinally, 'OnFinally');
		assert(IsCallable(onFinally));

		const result = onFinally();

		const C = get_slot(CatchFinally, 'Constructor');
		assert(IsConstructor(C));

		const promise = PromiseResolve(C, result);
		const thrower = () => { throw reason; };
		return Invoke(promise, 'then', [thrower]);
	};

	make_slots(CatchFinally, [
		'OnFinally',
		'Constructor',
	]);

	return CatchFinally;
}

module.exports = PromiseIntrinsic;
