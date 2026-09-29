"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [router, loading, isAuthenticated]);

  return null;
}
