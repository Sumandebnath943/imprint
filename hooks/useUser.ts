"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user.store";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/user.types";

export function useUser() {
  const { profile, isLoading, setProfile, clearProfile, setLoading } =
    useUserStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          clearProfile();
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data as Profile);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, clearProfile, setLoading]);

  return { profile, isLoading };
}
