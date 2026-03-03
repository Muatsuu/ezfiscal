import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Log auth events
      if (event === "SIGNED_IN" && session?.user) {
        supabase.from("audit_logs").insert({
          user_id: session.user.id,
          user_email: session.user.email || "",
          action: "login",
          entity_type: "auth",
        }).then(() => {});
      }
      if (event === "SIGNED_OUT") {
        // Can't log after sign out since user_id would be null
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
