import test from "ava";
import sinon from "ts-sinon";
import reduxPromise from "../lib";

const noop = () => {};

const GIVE_ME_META = "GIVE_ME_META";

const metaMiddleware = () => (next: any) => (action: any) =>
  action.type === GIVE_ME_META ? next({ ...action, meta: "here you go" }) : next(action);

const setup = () => {
  const baseDispatch = sinon.spy();

  const dispatch = (action: any) => {
    const methods = { dispatch, getState: noop };
    return metaMiddleware()(reduxPromise(methods)(baseDispatch))(action);
  };

  return {
    baseDispatch,
    dispatch,
    foobar: { foo: "bar" },
    err: new Error("Badness"),
  };
};

test("Dispatch promise payload  - Resolve", async (t) => {
  const { baseDispatch, dispatch, foobar } = setup();

  await dispatch({
    type: "ACTION_TYPE",
    payload: Promise.resolve(foobar),
  }).then((actualResolve: typeof foobar) => {
    t.is(actualResolve, foobar);
  });

  t.true(baseDispatch.calledTwice);
  t.is(baseDispatch.getCall(0).args[0].status, "fetching");
  t.is(baseDispatch.getCall(1).args[0].status, "resolved");
  t.is(baseDispatch.getCall(1).args[0].payload, foobar);
});

test("Dispatch promise payload - Reject", async (t) => {
  const { baseDispatch, dispatch, err } = setup();
  await dispatch({
    type: "ACTION_TYPE",
    payload: Promise.reject(err),
  }).catch((actualErr: Error) => {
    t.is(actualErr, err);
  });

  t.true(baseDispatch.calledTwice);
  t.is(baseDispatch.getCall(0).args[0].status, "fetching");
  t.is(baseDispatch.getCall(1).args[0].status, "rejected");
  t.is(baseDispatch.getCall(1).args[0].error, err);
});

test("Dispatch direct promise - Resolve", async (t) => {
  const { baseDispatch, dispatch, foobar } = setup();

  await dispatch(Promise.resolve(foobar)).then((actualResolve: typeof foobar) => {
    t.is(actualResolve, foobar);
  });

  const actualResolve = await dispatch(Promise.resolve(foobar));
  t.is(actualResolve, foobar);

  t.true(baseDispatch.calledTwice);
  for (const a of baseDispatch.getCalls()) {
    t.is(a.args[0], foobar);
  }
});

test("Dispatch direct promise - Reject", async (t) => {
  const { baseDispatch, dispatch, err } = setup();

  await dispatch(Promise.reject(err)).catch((actualErr: typeof err) => {
    t.is(actualErr, err);
  });

  try {
    await dispatch(Promise.reject(err));
  } catch (actualErr) {
    t.is(actualErr, err);
  }

  t.true(baseDispatch.calledTwice);
  for (const a of baseDispatch.getCalls()) {
    t.is(a.args[0], err);
  }
});

test("Ignores non-promises", (t) => {
  const { baseDispatch, dispatch, foobar } = setup();

  dispatch(foobar);

  t.true(baseDispatch.calledOnce);
  t.is(baseDispatch.getCall(0).args[0], foobar);

  dispatch({ type: "ACTION_TYPE", payload: foobar });

  t.true(baseDispatch.calledTwice);
  t.deepEqual(baseDispatch.getCall(1).args[0], {
    type: "ACTION_TYPE",
    payload: foobar,
  });
});

test("Start async dispatch from beginning of middleware chain", async (t) => {
  const { baseDispatch, dispatch } = setup();

  await dispatch(Promise.resolve({ type: GIVE_ME_META }));
  dispatch({ type: GIVE_ME_META });

  baseDispatch.getCalls().map((c: any) => {
    t.is(c.args[0].meta, "here you go");
  });
});
