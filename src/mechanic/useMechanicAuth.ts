import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fiivoo.mechanic.accessCode";

/**
 * Persists the mechanic's access code in localStorage so they stay "logged in"
 * on a shared garage device until they explicitly sign out.
 */
export function useMechanicAuth() {
  const [accessCode, setAccessCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (accessCode) window.localStorage.setItem(STORAGE_KEY, accessCode);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [accessCode]);

  const signIn = useCallback((code: string) => {
    setAccessCode(code.trim().toUpperCase());
  }, []);

  const signOut = useCallback(() => {
    setAccessCode(null);
  }, []);

  return { accessCode, signIn, signOut };
}
