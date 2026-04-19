import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet } from "../utils/apiClient";

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  profilePhoto?: string;
  isVerified: boolean;
  role: "admin" | "user";
  createdAt?: string;
  updatedAt?: string;
};

type AuthResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken?: string;
  };
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setSessionUser: (nextUser: AuthUser | null) => void;
  hasSelectedAvatar: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiGet<AuthResponse>("/users/me", undefined, {
        silent: true,
      });
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshUser,
      setSessionUser: setUser,
      hasSelectedAvatar: Boolean(user?.avatar && user.avatar !== "unselected" && user.avatar !== "abc"),
    }),
    [loading, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
