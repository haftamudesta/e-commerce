"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { userAPI, authUtils } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role?: string,
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authUtils.getToken();
      const storedUser = authUtils.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        try {
          await userAPI.getProfile();
        } catch (error) {
          authUtils.clearAuthData();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await userAPI.login({ username, password });
      const { access_token } = response.data;

      authUtils.setAuthData(access_token, { username });
      setToken(access_token);

      const profileResponse = await userAPI.getProfile();
      const userData =
        profileResponse.data.user_details || profileResponse.data;

      authUtils.setAuthData(access_token, userData);
      setUser(userData);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      router.push("/");
      router.refresh();
    } catch (error: any) {
      let errorMessage = "Login failed. Please check your credentials.";

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: string = "user",
  ) => {
    try {
      console.log("📝 Register attempt:", { username, email });

      await userAPI.signup({ username, email, password, role });

      await login(username, password);
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(", ");
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  const logout = () => {
    authUtils.clearAuthData();
    setToken(null);
    setUser(null);
    router.push("/sign-in");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
