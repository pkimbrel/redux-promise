import { isFSA } from "flux-standard-action";
import { Middleware } from "redux";

const isPromise = (obj: any) => {
  return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
};

export interface PromisePayload<A, P> {
  type: A;
  payload?: P;
  error?: string;
  status: "fetching" | "resolved" | "rejected";
}

const reduxPromise: Middleware<{}, any> = ({ dispatch }) => (next) => (action) => {
  if (!isFSA(action)) {
    if (isPromise(action)) {
      const promise = (action as unknown) as Promise<any>;

      return promise
        .then((result: any) => {
          dispatch(result);
          return Promise.resolve(result);
        })
        .catch((error: any) => {
          dispatch(error);
          return Promise.reject(error);
        });
    } else {
      return next(action);
    }
  }

  if (isPromise(action.payload)) {
    const promise = (action.payload as unknown) as Promise<any>;

    dispatch({ ...action, status: "fetching" });

    return promise
      .then((result: any) => {
        dispatch({ ...action, payload: result, status: "resolved" });
        return Promise.resolve(result);
      })
      .catch((error: any) => {
        dispatch({ ...action, error: error, status: "rejected" });
        return Promise.reject(error);
      });
  } else {
    next(action);
  }
};

export default reduxPromise;
