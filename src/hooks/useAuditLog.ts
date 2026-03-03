import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useCallback } from "react";

export const useAuditLog = () => {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();

  const log = useCallback(
    async (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => {
      if (!user) return;
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email || "",
        empresa_id: empresaAtiva?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
      });
    },
    [user, empresaAtiva]
  );

  return { log };
};
