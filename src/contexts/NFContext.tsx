import { NotaFiscal } from "@/types/notaFiscal";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NFContextType {
  notas: NotaFiscal[];
  loading: boolean;
  addNota: (nota: Omit<NotaFiscal, "id">) => Promise<void>;
  removeNota: (id: string) => Promise<void>;
  updateNota: (id: string, nota: Partial<NotaFiscal>) => Promise<void>;
}

const NFContext = createContext<NFContextType>({
  notas: [],
  loading: true,
  addNota: async () => {},
  removeNota: async () => {},
  updateNota: async () => {},
});

export const useNotas = () => useContext(NFContext);

export const NFProvider = ({ children }: { children: ReactNode }) => {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotas = useCallback(async () => {
    if (!user) {
      setNotas([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notas:", error);
      toast.error("Erro ao carregar notas fiscais");
    } else {
      setNotas(
        (data || []).map((d) => ({
          id: d.id,
          numero: d.numero,
          tipo: d.tipo as "servico" | "fornecedor",
          fornecedor: d.fornecedor,
          valor: Number(d.valor),
          setor: d.setor,
          dataEmissao: d.data_emissao,
          dataVencimento: d.data_vencimento,
          status: d.status as "pendente" | "paga" | "vencida",
          descricao: d.descricao || undefined,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const addNota = async (nota: Omit<NotaFiscal, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("notas_fiscais").insert({
      user_id: user.id,
      numero: nota.numero,
      tipo: nota.tipo,
      fornecedor: nota.fornecedor,
      valor: nota.valor,
      setor: nota.setor,
      data_emissao: nota.dataEmissao,
      data_vencimento: nota.dataVencimento,
      status: nota.status,
      descricao: nota.descricao || null,
    });
    if (error) {
      console.error("Error adding nota:", error);
      toast.error("Erro ao adicionar nota fiscal");
      return;
    }
    await fetchNotas();
  };

  const removeNota = async (id: string) => {
    const { error } = await supabase.from("notas_fiscais").delete().eq("id", id);
    if (error) {
      console.error("Error removing nota:", error);
      toast.error("Erro ao excluir nota fiscal");
      return;
    }
    setNotas((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNota = async (id: string, updates: Partial<NotaFiscal>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.numero !== undefined) dbUpdates.numero = updates.numero;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    if (updates.fornecedor !== undefined) dbUpdates.fornecedor = updates.fornecedor;
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.setor !== undefined) dbUpdates.setor = updates.setor;
    if (updates.dataEmissao !== undefined) dbUpdates.data_emissao = updates.dataEmissao;
    if (updates.dataVencimento !== undefined) dbUpdates.data_vencimento = updates.dataVencimento;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;

    const { error } = await supabase.from("notas_fiscais").update(dbUpdates).eq("id", id);
    if (error) {
      console.error("Error updating nota:", error);
      toast.error("Erro ao atualizar nota fiscal");
      return;
    }
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  return (
    <NFContext.Provider value={{ notas, loading, addNota, removeNota, updateNota }}>
      {children}
    </NFContext.Provider>
  );
};
