import { Middleware } from "redux";

export interface PromisePayload<A, P> {
  type: A;
  payload?: P;
  error?: any;
  status: "fetching" | "resolved" | "rejected";
}

declare const reduxPromise: Middleware<{}, any>;

export default reduxPromise;
