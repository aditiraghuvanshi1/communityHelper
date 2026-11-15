// Session boundary: auth is an httpOnly cookie the backend owns; the frontend's one
// duty is wiping the react-query cache so one account's data never renders for the next.
import { queryClient } from "./queryClient";
import { apiPost } from "./api";
import type { User } from "./types";
import type { NavigateFunction } from "react-router-dom";

// Call after every successful login/signup.
export function beginSession(user: User): void {
  queryClient.clear();
  queryClient.setQueryData(["me"], user);
}

// Call from every sign-out control; the hard redirect resets all in-memory state.
export async function endSession(navigate: NavigateFunction, redirectTo: string = "/login"): Promise<void> {
  await apiPost("/auth/logout");
  queryClient.clear();
  queryClient.setQueryData(["me"], null);
  navigate(redirectTo, { replace: true });
}
