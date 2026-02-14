"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { AuthResponse, AuthUser } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp * 1000;
        if (Date.now() < exp) {
          setUser({
            id: payload.sub,
            type: "PERSON",
            email: "",
            role: payload.role,
          });
        } else {
          api.clearTokens();
        }
      } catch {
        api.clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (data: Record<string, unknown>) => {
    const res = await api.post<AuthResponse>("/auth/signup", data);
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    api.clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
