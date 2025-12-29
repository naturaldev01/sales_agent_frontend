"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        try {
          // Validate token with server
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (e) {
          // Token invalid, clear storage
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublicPath) {
      router.push("/login");
    } else if (user && isPublicPath) {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (response.pendingApproval) {
      throw new Error('PENDING_APPROVAL');
    }
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role?: string) => {
      const response = await apiRegister(email, password, name, role);
      if (response.pendingApproval) {
        throw new Error('PENDING_APPROVAL');
      }
      setUser(response.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

