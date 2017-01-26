## Promise.prototype.finally ( _onFinally_ )

When the `finally` method is called with argument _onFinally_, the following steps are taken:
  1. Let _promise_ be the **this** value.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-ispromise">IsPromise</a>(_promise_) is **false**, throw a **TypeError** exception.
  1. Let _thenFinally_ be ! CreateThenFinally(_onFinally_).
  1. Let _catchFinally_ be ! CreateCatchFinally(_onFinally_).
  1. Return ? <a href="https://tc39.github.io/ecma262/#sec-invoke">Invoke</a>(_promise_, *"then"*, &laquo; _thenFinally_, _catchFinally_ &raquo;).

## CreateThenFinally ( _onFinally_ )

The abstract operation CreateCatchFinally takes an _onFinally_ function, and returns a callback function for use in Promise.prototype.finally.
  1. If <a href="https://tc39.github.io/ecma262/#sec-iscallable">IsCallable</a>(_onFinally_) is not **true**, return _onFinally_.
  1. Return a function that takes one argument, _value_, and when invoked, performs the following steps:
    1. Let _result_ be ? Call(_onFinally_, *undefined*).
    1. Let _promise_ be ! PromiseResolve(%Promise%, _result_).
    1. Let _valueThunk_ be equivalent to a function that returns _value_.
    1. Let _promiseCapability_ be ! NewPromiseCapability(%Promise%).
    1. Return PerformPromiseThen(_promise_, _valueThunk_, *undefined*, _promiseCapability_).

## CreateCatchFinally ( _onFinally_ )

The abstract operation CreateCatchFinally takes an _onFinally_ function, and returns a callback function for use in Promise.prototype.finally.
  1. If <a href="https://tc39.github.io/ecma262/#sec-iscallable">IsCallable</a>(_onFinally_) is not **true**, return _onFinally_.
  1. Return a function that takes one argument, _reason_, and when invoked, performs the following steps:
    1. Let _result_ be ? Call(_onFinally_, *undefined*).
    1. Let _promise_ be ! PromiseResolve(%Promise%, _result_).
    1. Let _thrower_ be equivalent to a function that throws _reason_.
    1. Let _promiseCapability_ be ! NewPromiseCapability(%Promise%).
    1. Return PerformPromiseThen(_promise_, _thrower_, *undefined*, _promiseCapability_).

## Promise.resolve ( _x_ )

The `resolve` function returns either a new promise resolved with the passed argument, or the argument itself if the argument is a promise produced by this constructor.
  1. Let _C_ be the *this* value.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values">Type</a>(_C_) is not Object, throw a *TypeError* exception.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/#sec-ispromise">IsPromise</a>(_x_) is *true*, then
    1. Let _xConstructor_ be ? <a href="http://www.ecma-international.org/ecma-262/6.0/#sec-get-o-p">Get</a>(_x_, `"constructor"`).
    1. If SameValue(_xConstructor_, _C_) is *true*, return _x_.
  1. Return ? PromiseResolve(_C_, _x_).

Note: the `resolve` function expects its *this* value to be a constructor function that supports the parameter conventions of the `Promise` constructor.

## PromiseResolve ( _C_, _x_ )
The abstract operation PromiseResolve, given a constructor and a value, returns either a new promise resolved with the passed argument, or the argument itself if the argument is a promise produced by this constructor.
  1. Assert: <a href="http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values">Type</a>(_C_) is Object.
  1. Let _promiseCapability_ be ? <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-newpromisecapability">NewPromiseCapability</a>(_C_).
  1. Perform ? <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-call">Call</a>(_promiseCapability_.[[Resolve]], *undefined*, &laquo; _x_ &raquo;).
  1. Return _promiseCapability_.[[Promise]].
