global.foo = 0;
global.id = 1;
const {
	Call,
	EnqueueJob,
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

let PromiseIntrinsic;

function IfAbruptRejectPromise(value, capability) {
	// Usage: pass it exceptions; it only handles that case.
	// Always use `return` before it, i.e. `try { ... } catch (e) { return IfAbruptRejectPromise(e, capability); }`.
	Call(get_slot(capability, '[[Reject]]'), value);
	return get_slot(capability, '[[Promise]]');
}

function CreateResolvingFunctions(promise) {
	const alreadyResolved = {};
	make_slots(alreadyResolved, [
		'[[Value]]',
	]);
	set_slot(alreadyResolved, '[[Value]]', false);

	function resolve(resolution) {
		assert(has_slot(resolve, '[[Promise]]'));
		const promise = get_slot(resolve, '[[Promise]]');
		assert(Type(promise) === 'Object');

		const alreadyResolved = get_slot(resolve, '[[AlreadyResolved]]');
		if (get_slot(alreadyResolved, '[[Value]]') === true) {
			return;
		}

		set_slot(alreadyResolved, '[[Value]]', true);

		if (SameValue(resolution, promise) === true) {
			const selfResolutionError = new TypeError('self resolution');
			return RejectPromise(promise, selfResolutionError);
		}

		if (Type(resolution) !== 'Object') {
			return FulfillPromise(promise, resolution);
		}

		let thenAction;
		try {
			thenAction = Get(resolution, 'then');
		} catch (thenActionE) {
			return RejectPromise(promise, thenActionE);
		}

		if (IsCallable(thenAction) === false) {
			return FulfillPromise(promise, resolution);
		}

		EnqueueJob('PromiseJobs', PromiseResolveThenableJob, [promise, resolution, thenAction]);
	}
	make_slots(resolve, [
		'[[Promise]]',
		'[[AlreadyResolved]]',
	]);
	set_slot(resolve, '[[Promise]]', promise);
	set_slot(resolve, '[[AlreadyResolved]]', alreadyResolved);

	function reject(reason) {
		assert(has_slot(reject, '[[Promise]]'));
		const promise = get_slot(reject, '[[Promise]]');
		assert(Type(promise) === 'Object');

		const alreadyResolved = get_slot(reject, '[[AlreadyResolved]]');
		if (get_slot(alreadyResolved, '[[Value]]') === true) {
			return undefined;
		}

		set_slot(alreadyResolved, '[[Value]]', true);

		return RejectPromise(promise, reason);
	}
	make_slots(reject, [
		'[[Promise]]',
		'[[AlreadyResolved]]',
	]);
	set_slot(reject, '[[Promise]]', promise);
	set_slot(reject, '[[AlreadyResolved]]', alreadyResolved);

	const record = {};
	make_slots(record, [
		'[[Resolve]]',
		'[[Reject]]',
	]);
	set_slot(record, '[[Resolve]]', resolve);
	set_slot(record, '[[Reject]]', reject);
	return record;
}

function FulfillPromise(promise, value) {
	assert(get_slot(promise, '[[PromiseState]]') === 'pending');

	const reactions = get_slot(promise, '[[PromiseFulfillReactions]]');

	set_slot(promise, '[[PromiseResult]]', value);
	set_slot(promise, '[[PromiseFulfillReactions]]', undefined);
	set_slot(promise, '[[PromiseRejectReactions]]', undefined);
	set_slot(promise, '[[PromiseState]]', 'fulfilled');

	return TriggerPromiseReactions(reactions, value);
}

function NewPromiseCapability(C) {
	if (IsConstructor(C) === false) {
		throw new TypeError('NewPromiseCapability only works on constructors');
	}

	const promiseCapability = {};
	make_slots(promiseCapability, [
		'[[Promise]]',
		'[[Resolve]]',
		'[[Reject]]',
	]);
	set_slot(promiseCapability, '[[Promise]]', undefined);
	set_slot(promiseCapability, '[[Resolve]]', undefined);
	set_slot(promiseCapability, '[[Reject]]', undefined);
	function executor(resolve, reject) {
		const promiseCapability = get_slot(executor, '[[Capability]]');

		assert(IsPromiseCapabilityRecord(promiseCapability));

		if (get_slot(promiseCapability, '[[Resolve]]') !== undefined) {
			throw new TypeError('Promise capability must not have [[Resolve]] set when calling executor');
		}
		if (get_slot(promiseCapability, '[[Reject]]') !== undefined) {
			throw new TypeError('Promise capability must not have [[Reject]] set when calling executor');
		}

		set_slot(promiseCapability, '[[Resolve]]', resolve);
		set_slot(promiseCapability, '[[Reject]]', reject);

		return undefined;
	}
	make_slots(executor, ['[[Capability]]']);
	set_slot(executor, '[[Capability]]', promiseCapability);

	const promise = new C(executor);
	if (IsCallable(get_slot(promiseCapability, '[[Resolve]]')) === false) {
		throw new TypeError('The given constructor did not correctly set a [[Resolve]] function on the promise capability');
	}
	if (IsCallable(get_slot(promiseCapability, '[[Reject]]')) === false) {
		throw new TypeError('The given constructor did not correctly set a [[Reject]] function on the promise capability');
	}

	set_slot(promiseCapability, '[[Promise]]', promise);
	return promiseCapability;
}

function IsPromiseCapabilityRecord(x) {
	const promise = get_slot(x, '[[Promise]]');
	if (promise !== undefined && !IsPromise(promise)) {
		return false;
	}

	const resolve = get_slot(x, '[[Resolve]]');
	const reject = get_slot(x, '[[Reject]]');
	if (resolve !== undefined && !IsCallable(resolve)) {
		return false;
	}
	if (reject !== undefined && !IsCallable(reject)) {
		return false;
	}

	return true;
}

function IsPromiseReactionRecord(x) {
	if (Type(x) !== 'Object') {
		return false;
	}

	if (!has_slot(x, '[[Capability]]')) {
		return false;
	}
	if (!has_slot(x, '[[Type]]')) {
		return false;
	}
	const type = get_slot(x, '[[Type]]');
	if (type !== 'Fulfill' && type !== 'Reject') {
		return false;
	}

	if (!has_slot(x, '[[Handler]]')) {
		return false;
	}
	const handler = get_slot(x, '[[Handler]]');
	if (!IsCallable(handler) && handler !== undefined) {
		return false;
	}

	return true;
}

function IsPromise(x) {
	if (Type(x) !== 'Object') {
		return false;
	}

	if (!has_slot(x, '[[PromiseState]]')) {
		return false;
	}

	return true;
}

function RejectPromise(promise, reason) {
	assert(get_slot(promise, '[[PromiseState]]') === 'pending');

	const reactions = get_slot(promise, '[[PromiseRejectReactions]]');

	set_slot(promise, '[[PromiseResult]]', reason);
	set_slot(promise, '[[PromiseFulfillReactions]]', undefined);
	set_slot(promise, '[[PromiseRejectReactions]]', undefined);
	set_slot(promise, '[[PromiseState]]', 'rejected');

	if (get_slot(promise, '[[PromiseIsHandled]]') === false) {
		HostPromiseRejectionTracker(promise, 'reject');
	}

	return TriggerPromiseReactions(reactions, reason);
}

function TriggerPromiseReactions(reactions, argument) {
	for (const reaction of reactions) {
		EnqueueJob('PromiseJobs', PromiseReactionJob, [reaction, argument]);
	}

	return undefined;
}

function HostPromiseRejectionTracker(promise, operation) {
	assert(IsPromise(promise));
	assert(operation === 'reject' || operation === 'handle');
}

function NewCompletionRecord(type, value, target) {
	const completionRecord = {};
	make_slots(completionRecord, [
		'[[Type]]',
		'[[Value]]',
		'[[Target]]',
	]);
	set_slot(completionRecord, '[[Type]]', type);
	set_slot(completionRecord, '[[Value]]', value);
	set_slot(completionRecord, '[[Target]]', target);
	return completionRecord;
}

function isCompletionRecord(completionRecord) {
	if (!has_slot(completionRecord, '[[Type]]') || !has_slot(completionRecord, '[[Value]]') || !has_slot(completionRecord, '[[Target]]')) {
		return false;
	}
	const type = get_slot(completionRecord, '[[Type]]');
	const possibleTypes = ['normal', 'break', 'continue', 'return', 'throw'];
	if (!possibleTypes.includes(type)) {
		return false;
	}

	const target = get_slot(completionRecord, '[[Target]]');
	if (typeof target !== 'undefined' && typeof	target !== 'string') {
		return false;
	}
	return true;
}

function NormalCompletion(value) {
	return NewCompletionRecord('normal', value);
}

function AbruptCompletion(value) {
	return NewCompletionRecord('throw', value);
}

function isAbruptCompletion(completionRecord) {
	return isCompletionRecord(completionRecord) && get_slot(completionRecord, '[[Type]]') === 'throw';
}

function PromiseReactionJob(reaction, argument) {
	assert(IsPromiseReactionRecord(reaction) === true);

	const promiseCapability = get_slot(reaction, '[[Capability]]');
	const type = get_slot(reaction, '[[Type]]');
	const handler = get_slot(reaction, '[[Handler]]');

	let handlerResult;
	if (handler === undefined) {
		if (type === 'Fulfill') {
			handlerResult = NormalCompletion(argument);
		} else {
			assert(type === 'Reject');
			handlerResult = AbruptCompletion(argument);
		}
	} else {
		try {
			handlerResult = NormalCompletion(Call(handler, undefined, [argument]));
		} catch (callE) {
			handlerResult = AbruptCompletion(callE);
		}
	}

	let status;
	if (isAbruptCompletion(handlerResult)) {
		status = Call(get_slot(promiseCapability, '[[Reject]]'), undefined, [get_slot(handlerResult, '[[Value]]')]);
	} else {
		status = Call(get_slot(promiseCapability, '[[Resolve]]'), undefined, [get_slot(handlerResult, '[[Value]]')]);
	}
	return status;
}

function PromiseResolveThenableJob(promiseToResolve, thenable, then) {
	const resolvingFunctions = CreateResolvingFunctions(promiseToResolve);

	try {
		Call(then, thenable, [
			get_slot(resolvingFunctions, '[[Resolve]]'),
			get_slot(resolvingFunctions, '[[Reject]]'),
		]);
	} catch (thenCallResultE) {
		Call(get_slot(resolvingFunctions, '[[Reject]]'), undefined, [thenCallResultE]);
	}
}

PromiseIntrinsic = class Promise {
	constructor(executor) {
		if (IsCallable(executor) === false) {
			throw new TypeError('executor must be callable');
		}

		// Cheating a bit on NewTarget stuff here.

		const promise = this;
		make_slots(promise, [
			'[[PromiseState]]',
			'[[PromiseConstructor]]',
			'[[PromiseResult]]',
			'[[PromiseFulfillReactions]]',
			'[[PromiseRejectReactions]]',
			'[[PromiseIsHandled]]',
		]);

		set_slot(promise, '[[PromiseConstructor]]', this.constructor);
		set_slot(promise, '[[PromiseState]]', 'pending');
		set_slot(promise, '[[PromiseFulfillReactions]]', []);
		set_slot(promise, '[[PromiseRejectReactions]]', []);
		set_slot(promise, '[[PromiseIsHandled]]', false);
		promise.id = global.id++;

		const resolvingFunctions = CreateResolvingFunctions(promise);

		try {
			Call(executor, undefined, [
				get_slot(resolvingFunctions, '[[Resolve]]'),
				get_slot(resolvingFunctions, '[[Reject]]')
			]);
		} catch (completionE) {
			Call(get_slot(resolvingFunctions, '[[Reject]]'), undefined, [completionE]);
		}

		return promise;
	}

	static all(iterable) {
		let C = this;

		if (Type(C) !== 'Object') {
			throw new TypeError('Promise.all must be called on an object');
		}

		const S = Get(C, atAtSpecies);
		if (S !== undefined && S !== null) {
			C = S;
		}

		// The algorithm and indirection here, with PerformPromiseAll, manual iteration, and the closure-juggling, is just
		// too convoluted compared to normal ES code, so let's skip it. The following should be equivalent; it maintains
		// some of the formal translation in places, but skips on some of the structure.

		return new C((resolve, reject) => {
			const values = [];

			let remainingElementsCount = 1;
			let index = 0;

			for (const nextValue of iterable) {
				values.push(undefined);
				const nextPromise = Invoke(C, 'resolve', [nextValue]);

				let alreadyCalled = false;
				const resolveElement = x => {
					if (alreadyCalled === true) {
						return undefined;
					}
					alreadyCalled = true;
					values[index] = x;

					remainingElementsCount = remainingElementsCount - 1;
					if (remainingElementsCount === 0) {
						resolve(values);
					}
				};

				remainingElementsCount = remainingElementsCount + 1;

				Invoke(nextPromise, 'then', [resolveElement, reject]);

				index += 1;
			}
		});
	}

	static race(iterable) {
		let C = this;

		if (Type(C) !== 'Object') {
			throw new TypeError('Promise.all must be called on an object');
		}

		const S = Get(C, atAtSpecies);
		if (S !== undefined && S !== null) {
			C = S;
		}

		// Similarly to for `Promise.all`, we avoid some of the indirection here.

		return new C((resolve, reject) => {
			for (const nextValue of iterable) {
				const nextPromise = Invoke(C, 'resolve', [nextValue]);
				Invoke(nextPromise, 'then', [resolve, reject]);
			}
		});
	}

	static reject(r) {
		let C = this;

		if (Type(C) !== 'Object') {
			throw new TypeError('Promise.all must be called on an object');
		}

		const S = Get(C, atAtSpecies);
		if (S !== undefined && S !== null) {
			C = S;
		}

		const promiseCapability = NewPromiseCapability(C);
		Call(get_slot(promiseCapability, '[[Reject]]'), undefined, [r]);
		return get_slot(promiseCapability, '[[Promise]]');
	}

	static resolve(x) {
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

	static get [atAtSpecies]() {
		return this;
	}

	catch(onRejected) {
		return Invoke(this, 'then', [undefined, onRejected]);
	}

	then(onFulfilled, onRejected) {
		const promise = this;
		if (IsPromise(this) === false) {
			throw new TypeError('Promise.prototype.then only works on real promises');
		}

		const C = SpeciesConstructor(promise, Promise);
		const resultCapability = NewPromiseCapability(C);
		return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability);
	}

	finally(onFinally) {
		const promise = this;
		if (IsPromise(this) === false) {
			throw new TypeError('Promise.prototype.finally only works on real promises');
		}

		const thenFinally = CreateThenFinally(onFinally);
		const catchFinally = CreateCatchFinally(onFinally);

		return promise.then(thenFinally, catchFinally);
	}
}

function PromiseResolve(C, x) {
	assert(Type(C) === 'Object');

	const promiseCapability = NewPromiseCapability(C);
	Call(get_slot(promiseCapability, '[[Resolve]]'), undefined, [x]);
	return get_slot(promiseCapability, '[[Promise]]');
}

function createPromiseReactionRecord(capability, type, handler) {
	const record = {};
	make_slots(record, [
		'[[Capability]]',
		'[[Type]]',
		'[[Handler]]',
	]);
	set_slot(record, '[[Capability]]', capability);
	set_slot(record, '[[Type]]', type);
	set_slot(record, '[[Handler]]', handler);
	return record;
}

function PerformPromiseFinally(promise, onFinally, resultCapability) {
	assert(IsPromise(promise) === true);
	assert(IsPromiseCapabilityRecord(resultCapability) === true);

	if (IsCallable(onFinally) === false) {
		return PerformPromiseThen(promise, undefined, undefined, resultCapability);
	}

	const thenFinally = CreateThenFinally(onFinally);
	const catchFinally = CreateCatchFinally(onFinally);

	return PerformPromiseThen(promise, thenFinally, catchFinally, resultCapability);
}

function CreateThenFinally(onFinally) {
	if (IsCallable(onFinally) !== true) {
		return onFinally;
	}

	return (value) => {
		const result = onFinally();
		const promise = PromiseResolve(PromiseIntrinsic, result);
		const valueThunk = () => value;
		const promiseCapability = NewPromiseCapability(PromiseIntrinsic);
		return PerformPromiseThen(promise, valueThunk, undefined, promiseCapability);
	};
}

function CreateCatchFinally(onFinally) {
	if (IsCallable(onFinally) !== true) {
		return onFinally;
	}

	return (reason) => {
		const result = onFinally();
		const promise = PromiseResolve(PromiseIntrinsic, result);
		const throwReason = () => { throw reason; };
		const promiseCapability = NewPromiseCapability(PromiseIntrinsic);
		return PerformPromiseThen(promise, throwReason, undefined, promiseCapability);
	};
}

function PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability) {
	assert(IsPromise(promise) === true);
	assert(IsPromiseCapabilityRecord(resultCapability) === true);

	if (IsCallable(onFulfilled) === false) {
		onFulfilled = undefined;
	}

	if (IsCallable(onRejected) === false) {
		onRejected = undefined;
	}

	const fulfillReaction = createPromiseReactionRecord(resultCapability, 'Fulfill', onFulfilled);
	const rejectReaction = createPromiseReactionRecord(resultCapability, 'Reject', onRejected);

	const state = get_slot(promise, '[[PromiseState]]');
	if (state === 'pending') {
		get_slot(promise, '[[PromiseFulfillReactions]]').push(fulfillReaction);
		get_slot(promise, '[[PromiseRejectReactions]]').push(rejectReaction);
	} else if (state === 'fulfilled') {
		const value = get_slot(promise, '[[PromiseResult]]');
		EnqueueJob('PromiseJobs', PromiseReactionJob, [fulfillReaction, value]);
	} else {
		assert(state === 'rejected');
		const reason = get_slot(promise, '[[PromiseResult]]');
		if (get_slot(promise, '[[PromiseIsHandled]]') === false) {
			HostPromiseRejectionTracker(promise, 'handle');
		}
		EnqueueJob('PromiseJobs', PromiseReactionJob, [rejectReaction, reason]);
	}

	set_slot(promise, '[[PromiseIsHandled]]', true);
	return get_slot(resultCapability, '[[Promise]]');
}

module.exports = PromiseIntrinsic;
