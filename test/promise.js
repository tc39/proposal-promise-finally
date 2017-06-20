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
		const thenFinally = CreateThenFinally(C, onFinally);
		const catchFinally = CreateCatchFinally(C, onFinally);

		return promise.then(thenFinally, catchFinally);
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

		if (IsPromise(x) === true) {
			const xConstructor = Get(x, 'constructor');
			if (SameValue(xConstructor, C) === true) {
				return x;
			}
		}

		return PromiseResolve(C, x);
	}
});

function PromiseResolve(C, x) {
	assert(Type(C) === 'Object');

	const promiseCapability = NewPromiseCapability(C);
	Call(get_slot(promiseCapability, '[[Resolve]]'), undefined, [x]);
	return get_slot(promiseCapability, '[[Promise]]');
}

function CreateThenFinally(C, onFinally) {
	assert(IsConstructor(C));

	if (IsCallable(onFinally) !== true) {
		return onFinally;
	}

	const ThenFinally = (value) => {
		const onFinally = get_slot(ThenFinally, 'onFinally');
		assert(IsCallable(onFinally));

		const result = onFinally();

		const C = get_slot(ThenFinally, 'Constructor');
		assert(IsConstructor(C));

		const promise = PromiseResolve(C, result);
		const valueThunk = () => value;
		return Invoke(promise, 'then', [valueThunk]);
	};

	make_slots(ThenFinally, [
		'onFinally',
		'Constructor',
	]);
	set_slot(ThenFinally, 'onFinally', onFinally);
	set_slot(ThenFinally, 'Constructor', C);

	return ThenFinally;
}

function CreateCatchFinally(C, onFinally) {
	assert(IsConstructor(C));

	if (IsCallable(onFinally) !== true) {
		return onFinally;
	}

	const CatchFinally = (reason) => {
		const onFinally = get_slot(CatchFinally, 'onFinally');
		assert(IsCallable(onFinally));

		const result = onFinally();

		const C = get_slot(CatchFinally, 'Constructor');
		assert(IsConstructor(C));

		const promise = PromiseResolve(C, result);
		const thrower = () => { throw reason; };
		return Invoke(promise, 'then', [thrower]);
	};

	make_slots(CatchFinally, [
		'onFinally',
		'Constructor',
	]);
	set_slot(CatchFinally, 'onFinally', onFinally);
	set_slot(CatchFinally, 'Constructor', C);

	return CatchFinally;
}

module.exports = PromiseIntrinsic;
