import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaAtiva: Empresa | null;
  setEmpresaAtiva: (empresa: Empresa | null) => void;
  loading: boolean;
  userRole: "admin" | "user" | null;
  isAdmin: boolean;
  refreshEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType>({
  empresas: [],
  empresaAtiva: null,
  setEmpresaAtiva: () => {},
  loading: true,
  userRole: null,
  isAdmin: false,
  refreshEmpresas: async () => {},
});

export const useEmpresa = () => useContext(EmpresaContext);

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user) { setUserRole(null); return; }
    const { data } = await supabase.rpc("get_my_role");
    setUserRole(data === "admin" ? "admin" : "user");
  }, [user]);

  const fetchEmpresas = useCallback(async () => {
    if (!user) { setEmpresas([]); setLoading(false); return; }
    const { data } = await supabase.from("empresas").select("id, nome, cnpj").order("nome");
    const list = (data || []) as Empresa[];
    setEmpresas(list);

    // Restore last active or pick first
    const savedId = localStorage.getItem(`empresa_ativa_${user.id}`);
    const saved = list.find((e) => e.id === savedId);
    if (saved) {
      setEmpresaAtiva(saved);
    } else if (list.length > 0) {
      setEmpresaAtiva(list[0]);
    } else {
      setEmpresaAtiva(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
    fetchEmpresas();
  }, [fetchRole, fetchEmpresas]);

  const handleSetEmpresaAtiva = (empresa: Empresa | null) => {
    setEmpresaAtiva(empresa);
    if (empresa && user) {
      localStorage.setItem(`empresa_ativa_${user.id}`, empresa.id);
    }
  };

  return (
    <EmpresaContext.Provider
      value={{
        empresas,
        empresaAtiva,
        setEmpresaAtiva: handleSetEmpresaAtiva,
        loading,
        userRole,
        isAdmin: userRole === "admin",
        refreshEmpresas: fetchEmpresas,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
};
