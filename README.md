# [Promise.prototype.finally](https://www.npmjs.com/package/promise.prototype.finally)
ECMAScript Proposal, specs, and reference implementation for `Promise.prototype.finally`

Spec drafted by [@ljharb](https://github.com/ljharb), following the lead from the [cancelable promise proposal](https://github.com/tc39/proposal-cancelable-promises/blob/e31520fc9a53a8cbeff53b0df413d9e565b27d69/Third%20State.md#promiseprototypefinally-implementation).

Get the polyfill/shim on [npm](https://www.npmjs.com/package/promise.prototype.finally).

This proposal is currently [stage 4](https://github.com/tc39/proposals/blob/master/finished-proposals.md) of the [process](https://tc39.github.io/process-document/).

## Rationale
Many promise libraries have a "finally" method, for registering a callback to be invoked when a promise is settled (either fulfilled, or rejected). The essential use case here is cleanup - I want to hide the "loading" spinner on my AJAX request, or I want to close any file handles I’ve opened, or I want to log that an operation has completed regardless of whether it succeeded or not.

### Why not `.then(f, f)`?
`promise.finally(func)` is similar to `promise.then(func, func)`, but is different in a few critical ways:
 - When creating a function inline, you can pass it once, instead of being forced to either declare it twice, or create a variable for it
 - A `finally` callback will not receive any argument, since there's no reliable means of determining if the promise was fulfilled or rejected. This use case is for precisely when you *do not care* about the rejection reason, or the fulfillment value, and so there's no need to provide it.
 - Unlike `Promise.resolve(2).then(() => {}, () => {})` (which will be resolved with `undefined`), `Promise.resolve(2).finally(() => {})` will be resolved with `2`.
 - Similarly, unlike `Promise.reject(3).then(() => {}, () => {})` (which will be resolved with `undefined`), `Promise.reject(3).finally(() => {})` will be rejected with `3`.

However, please note: a `throw` (or returning a rejected promise) in the `finally` callback will reject the new promise with that rejection reason.

## Naming
The reasons to stick with `finally` are straightforward: just like `catch`, `finally` would be an analog to the similarly-named syntactic forms from `try`/`catch`/`finally` (`try`, of course, not really having an analog any closer than `Promise.resolve().then`). Syntactic finally can only modify the return value with an “abrupt completion”: either throwing an exception, or returning a value early. `Promise#finally` will not be able to modify the return value, except by creating an abrupt completion by throwing an exception (ie, rejecting the promise) - since there is no way to distinguish between a “normal completion” and an early `return undefined`, the parallel with syntactic finally must have a slight consistency gap.

I’d briefly considered `always` as an alternative, since that wouldn’t imply ordering, but I think the parallels to the syntactic variation are compelling.

## Implementations
 - [Bluebird#finally](http://bluebirdjs.com/docs/api/finally.html)
 - [Q#finally](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback)
 - [when#finally](https://github.com/cujojs/when/blob/master/docs/api.md#promisefinally)
 - [jQuery jqXHR#always](http://api.jquery.com/jQuery.ajax/#jqXHR)

## Spec
You can view the spec in [markdown format](spec.md) or rendered as [HTML](https://tc39.github.io/proposal-promise-finally/).
