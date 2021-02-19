export interface PromisePayload<A, P> {
  type: A;
  payload?: P;
  error?: string;
  status: "fetching" | "resolved" | "rejected";
}
