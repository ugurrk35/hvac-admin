'use client'
import { AuthProvider } from "@/lib/hooks/useAuth";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}