"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export type AuthState = {
  /** The signed-in user, or null when signed out or accounts aren't configured. */
  user: User | null;
  /** False until the first session check has finished. */
  ready: boolean;
};

/** Follows the Supabase session: restores it on load, then tracks sign in and sign out. */
export function useAuthUser(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setUser(data.session?.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}
