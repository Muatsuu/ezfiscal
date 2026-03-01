import { NotaFiscal } from "@/types/notaFiscal";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NFContextType {
  notas: NotaFiscal[];
  loading: boolean;
  addNota: (nota: Omit<NotaFiscal, "id">) => Promise<string | null>;
  removeNota: (id: string) => Promise<void>;
  updateNota: (id: string, nota: Partial<NotaFiscal>) => Promise<void>;
  uploadAttachment: (notaId: string, file: File) => Promise<string | null>;
  getAttachmentUrl: (path: string) => Promise<string | null>;
}

const NFContext = createContext<NFContextType>({
  notas: [],
  loading: true,
  addNota: async () => null,
  removeNota: async () => {},
  updateNota: async () => {},
  uploadAttachment: async () => null,
  getAttachmentUrl: async () => null,
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
          attachmentPath: (d as any).attachment_path || undefined,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const addNota = async (nota: Omit<NotaFiscal, "id">): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from("notas_fiscais").insert({
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
    }).select("id").single();
    if (error) {
      console.error("Error adding nota:", error);
      toast.error("Erro ao adicionar nota fiscal");
      return null;
    }
    await fetchNotas();
    return data?.id || null;
  };

  const removeNota = async (id: string) => {
    // Also remove attachment if exists
    const nota = notas.find(n => n.id === id);
    if (nota?.attachmentPath) {
      await supabase.storage.from("nf-attachments").remove([nota.attachmentPath]);
    }
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
    if (updates.attachmentPath !== undefined) dbUpdates.attachment_path = updates.attachmentPath;

    const { error } = await supabase.from("notas_fiscais").update(dbUpdates).eq("id", id);
    if (error) {
      console.error("Error updating nota:", error);
      toast.error("Erro ao atualizar nota fiscal");
      return;
    }
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const uploadAttachment = async (notaId: string, file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${user.id}/${notaId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("nf-attachments")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erro ao anexar arquivo");
      return null;
    }

    // Save path to nota
    await updateNota(notaId, { attachmentPath: path });
    return path;
  };

  const getAttachmentUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("nf-attachments")
      .createSignedUrl(path, 3600); // 1 hour
    return data?.signedUrl || null;
  };

  return (
    <NFContext.Provider value={{ notas, loading, addNota, removeNota, updateNota, uploadAttachment, getAttachmentUrl }}>
      {children}
    </NFContext.Provider>
  );
};
