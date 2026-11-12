"use client";
import { createContext, useContext } from "react";
import { type Action, type User, can } from "./permissions";

const Ctx = createContext<User | null>(null);
export function UserProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useUser() {
  const u = useContext(Ctx);
  if (!u) throw new Error("useUser di luar UserProvider");
  return u;
}

export function useCan(action: Action) {
  return can(useUser().role, action);
}
