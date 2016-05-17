## Promise.prototype.finally ( _onFinally_ )

When the `finally` method is called with argument _onFinally_, the following steps are taken:
  1. Let _promise_ be the **this** value.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-ispromise">IsPromise</a>(_promise_) is **false**, throw a **TypeError** exception.
  1. Let _C_ be ? <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-speciesconstructor">SpeciesConstructor</a>(_promise_, %Promise%).
  1. Let _resultCapability_ be ? <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-newpromisecapability">NewPromiseCapability</a>(_C_).
  1. Return <a href="#performpromisefinally--promise-onfinally-resultcapability-">PerformPromiseFinally</a>(_promise_, _onFinally_, _resultCapability_).

## PromiseReaction Records

The PromiseReaction is a Record value used to store information about how a promise should react when it becomes resolved or rejected with a given value. PromiseReaction records are created by the PerformPromiseThen abstract operation, and are used by a <a href="#sec-promisereactionjob">PromiseReactionJob</a>.
PromiseReaction records have the fields listed in Table 58.
<table>
	<tbody>
	<tr>
		<th>Field Name</th>
		<th>Value</th>
		<th>Meaning</th>
	</tr>
	<tr>
		<td>[[Capabilities]]</td>
		<td>A PromiseCapability record</td>
		<td>The capabilities of the promise for which this record provides a reaction handler.</td>
	</tr>
	<tr>
		<td>[[Type]]</td>
		<td>Either <b>"Fulfill"</b>, <b>"Reject"</b>, or <b>"Finally"</b>.</td>
		<td></td>
	</tr>
	<tr>
		<td>[[Handler]]</td>
		<td>A function object or <b>undefined</b></td>
		<td>
			The function that should be applied to the incoming value, and whose return value will govern what happens to the derived promise. If [[Handler]] is <b>undefined</b>, a function that depends on the value of [[Type]] will be used instead.
		</td>
	</tr>
	</tbody>
</table>

## PerformPromiseFinally ( _promise_, _onFinally_, _resultCapability_ )

The abstract operation PerformPromiseFinally performs the &ldquo;finally&rdquo; operation on _promise_ using _onFinally_ as its settlement actions. The result is _resultCapability_'s promise.
  1. Assert: IsPromise(_promise_) is **true**.
  1. Assert: _resultCapability_ is a PromiseCapability record.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-iscallable">IsCallable</a>(_onFinally_) is **false**, then
    1. Let _onFinally_ be **undefined**.
  1. Let _reaction_ be the PromiseReaction { [[Capabilities]]: _resultCapability_, [[Type]]: `"Finally"`, [[Handler]]: _onFinally_ }.
  1. Return <a href="#enqueuepromisereactions--promise-fulfillreaction-rejectreaction-resultcapability-">EnqueuePromiseReactions</a>(_promise_, _reaction_, _reaction_, _resultCapability_).

## PerformPromiseThen ( _promise_, _oInFulfilled_, _onRejected_, _resultCapability_ )

The abstract operation PerformPromiseThen performs the &ldquo;then&rdquo; operation on _promise_ using _onFulfilled_ and _onRejected_ as its settlement actions. The result is _resultCapability_'s promise.
  1. Assert: IsPromise(_promise_) is **true**.
  1. Assert: _resultCapability_ is a PromiseCapability record.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-iscallable">IsCallable</a>(_onFulfilled_) is **false**, then
    1. Let _onFulfilled_ be **undefined**.
  1. If <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-iscallable">IsCallable</a>(_onRejected_) is **false**, then
    1. Let _onRejected_ be **undefined**.
  1. Let _fulfillReaction_ be the PromiseReaction { [[Capabilities]]: _resultCapability_, [[Type]]: `"Fulfill"`, [[Handler]]: _onFulfilled_ }.
  1. Let _rejectReaction_ be the PromiseReaction { [[Capabilities]]: _resultCapability_, [[Type]]: `"Reject"`, [[Handler]]: _onRejected_ }.
  1. Return <a href="#enqueuepromisereactions--promise-fulfillreaction-rejectreaction-resultcapability-">EnqueuePromiseReactions</a>(_promise_, _fulfillReaction_, _rejectReaction_, _resultCapability_).

## EnqueuePromiseReactions ( _promise_, _fulfillReaction_, _rejectReaction_, _resultCapability_ )

The abstract operation EnqueuePromiseReactions enqueues PromiseJobs with the provided PromiseReaction records on _promise_. The result is _resultCapability_'s promise.
  1. Assert: IsPromise(_promise_) is **true**.
  1. Assert: _resultCapability_ is a PromiseCapability record.
  1. Assert: _fulfillReaction_ is a PromiseReaction record.
  1. Assert: _rejectReaction_ is a PromiseReaction record.
  1. If the value of _promise_'s [[PromiseState]] internal slot is `"pending"`, then
    1. Append _fulfillReaction_ as the last element of the List that is the value of _promise_'s [[PromiseFulfillReactions]] internal slot.
    1. Append _rejectReaction_ as the last element of the List that is the value of _promise_'s [[PromiseRejectReactions]] internal slot.
  1. Else if the value of _promise_'s [[PromiseState]] internal slot is `"fulfilled"`, then
    1. Let _value_ be the value of _promise_'s [[PromiseResult]] internal slot.
    1. Perform <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-enqueuejob">EnqueueJob</a>(`"PromiseJobs"`, <a href="#sec-promisereactionjob">PromiseReactionJob</a>, &laquo; _fulfillReaction_, _value_ &raquo;).
  1. Else,
    1. Assert: The value of _promise_'s [[PromiseState]] internal slot is `"rejected"`.
    1. Let _reason_ be the value of _promise_'s [[PromiseResult]] internal slot.
    1. If the value of _promise_'s [[PromiseIsHandled]] internal slot is **false**, perform HostPromiseRejectionTracker(_promise_, `"handle"`).
    1. Perform EnqueueJob(`"PromiseJobs"`, <a href="#sec-promisereactionjob">PromiseReactionJob</a>, &laquo; _rejectReaction_, _reason_ &raquo;).
  1. Set _promise_'s [[PromiseIsHandled]] internal slot to **true**.
  1. Return _resultCapability_.[[Promise]].

## TriggerPromiseReactions ( _reactions_, _argument_ )

The abstract operation TriggerPromiseReactions takes a collection of PromiseReactionRecords and enqueues a new Job for each record. Each such Job processes the [[Type]] and [[Handler]] of the PromiseReactionRecord, and if the [[Handler]] is a function, calls it passing the given argument. If the [[Handler]] is **undefined**, the behavior is determined by the [[Type]].
  1. Repeat for each _reaction_ in _reactions_, in original insertion order
    1. Perform EnqueueJob(`"PromiseJobs"`, <a href="#sec-promisereactionjob">PromiseReactionJob</a>, &laquo; _reaction_, _argument_ &raquo;).
  1. Return **undefined**.

## PromiseReactionJob ( _reaction_, _argument_ )

The job PromiseReactionJob with parameters _reaction_ and _argument_ applies the appropriate handler to the incoming value, and uses the handler's return value to resolve or reject the derived promise associated with that handler.
  1. Assert: _reaction_ is a PromiseReaction Record.
  1. Let _promiseCapability_ be _reaction_.[[Capabilities]].
  1. Let _type_ be _reaction_.[[Type]].
  1. Let _handler_ be _reaction_.[[Handler]].
  1. If _handler_ is **undefined**, then
    1. If _type_ is `"Fulfill"`, let _handlerResult_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-normalcompletion">NormalCompletion</a>(_argument_).
    1. Else if _type_ is `"Reject"`, let _handlerResult_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-completion-record-specification-type">Completion</a>{[[Type]]: ~throw~, [[Value]]: _argument_, [[Target]]: ~empty~}.
    1. Else if _type_ is `"Finally"`, let _handlerResult_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-normalcompletion">NormalCompletion</a>(_argument_).
    1. Assert: _handlerResult_ is defined.
  1. Else if _type_ is `"Finally"`, let _handlerResult_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-call">Call</a>(_handler_, **undefined**, &laquo; &raquo;).
  1. Else, let _handlerResult_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-call">Call</a>(_handler_, **undefined**, &laquo; _argument_ &raquo;).
  1. If _handlerResult_ is an <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-completion-record-specification-type">abrupt completion</a>, then
    1. Let _status_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-call">Call</a>(_promiseCapability_.[[Reject]], **undefined**, &laquo; _handlerResult_.[[Value]] &raquo;).
  1. Else,
    1. Let _status_ be <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-call">Call</a>(_promiseCapability_.[[Resolve]], **undefined**, &laquo; _handlerResult_.[[Value]] &raquo;).
    1. If _type_ is `"Finally"` and _status_ is a normal completion, then
      1. Return <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-normalcompletion">NormalCompletion</a>(_handlerResult_.[[Value]]).
  1. Return <a href="http://www.ecma-international.org/ecma-262/6.0/index.html#sec-completion-record-specification-type">Completion</a>(_status_).
