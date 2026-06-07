"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthResult =
  | { success: true; message?: string }
  | { success: false; error: string };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  configured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signUp: async () => ({ success: false, error: "Supabase chưa được cấu hình." }),
  signInWithPassword: async () => ({
    success: false,
    error: "Supabase chưa được cấu hình.",
  }),
  signInWithMagicLink: async () => ({
    success: false,
    error: "Supabase chưa được cấu hình.",
  }),
  resetPassword: async () => ({
    success: false,
    error: "Supabase chưa được cấu hình.",
  }),
  updatePassword: async () => ({
    success: false,
    error: "Supabase chưa được cấu hình.",
  }),
});

export function useAuth() {
  return useContext(AuthContext);
}

function authCallbackUrl(next?: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const base = `${origin}/auth/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

function mapAuthError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (
    msg.includes("user already registered") ||
    msg.includes("already been registered")
  ) {
    return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Quá nhiều yêu cầu. Vui lòng đợi 1 phút.";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("failed to fetch")
  ) {
    return "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Kiểm tra hộp thư của bạn.";
  }

  return error.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signInWithGoogle = async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl("/"),
      },
    });
  };

  const signOut = async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!configured) {
      return { success: false, error: "Supabase chưa được cấu hình." };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: authCallbackUrl("/"),
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      if (data.session) {
        return { success: true };
      }

      return {
        success: true,
        message:
          "Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
      };
    } catch (e) {
      return {
        success: false,
        error: mapAuthError(e instanceof Error ? e : new Error(String(e))),
      };
    }
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    if (!configured) {
      return { success: false, error: "Supabase chưa được cấu hình." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: mapAuthError(e instanceof Error ? e : new Error(String(e))),
      };
    }
  };

  const signInWithMagicLink = async (email: string): Promise<AuthResult> => {
    if (!configured) {
      return { success: false, error: "Supabase chưa được cấu hình." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: authCallbackUrl("/"),
        },
      });

      if (error) {
        return {
          success: false,
          error: "Không thể gửi magic link. Vui lòng thử lại.",
        };
      }

      return {
        success: true,
        message: "Kiểm tra email để nhận magic link đăng nhập.",
      };
    } catch (e) {
      return {
        success: false,
        error: mapAuthError(e instanceof Error ? e : new Error(String(e))),
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!configured) {
      return { success: false, error: "Supabase chưa được cấu hình." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: authCallbackUrl("/auth/reset-password"),
        }
      );

      if (error) {
        return {
          success: false,
          error: "Không thể gửi email reset. Vui lòng thử lại.",
        };
      }

      return {
        success: true,
        message: "Kiểm tra email để nhận hướng dẫn đặt lại mật khẩu.",
      };
    } catch (e) {
      return {
        success: false,
        error: mapAuthError(e instanceof Error ? e : new Error(String(e))),
      };
    }
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!configured) {
      return { success: false, error: "Supabase chưa được cấu hình." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: mapAuthError(e instanceof Error ? e : new Error(String(e))),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured,
        signInWithGoogle,
        signOut,
        signUp,
        signInWithPassword,
        signInWithMagicLink,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
