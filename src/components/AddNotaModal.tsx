import { useState, useEffect } from "react";
import { SETORES } from "@/types/notaFiscal";
import { X, Sparkles, Upload, Loader2, Paperclip, FileCheck, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useNotas } from "@/contexts/NFContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import FornecedorCombobox from "@/components/FornecedorCombobox";
import DuplicateWarning from "@/components/DuplicateWarning";

const KEYWORDS_SETOR: Record<string, string[]> = {
  Administrativo: ["escritório", "material", "papelaria", "expediente", "administrativo", "recepção", "secretaria"],
  Manutenção: ["manutenção", "reparo", "conserto", "pintura", "elétrica", "hidráulica", "reforma", "limpeza"],
  Cozinha: ["cozinha", "alimento", "ingrediente", "comida", "refeição", "gás", "utensílio"],
  "GOV.": ["governo", "gov", "imposto", "taxa", "licença", "alvará", "prefeitura", "fiscal"],
  "A&B": ["bebida", "bar", "restaurante", "café", "cerveja", "drink", "coquetel", "buffet"],
  "Serviços Gerais": ["serviço", "terceirizado", "prestador", "contrato", "segurança", "portaria", "jardinagem"],
};

function sugerirSetor(descricao: string): string | null {
  const desc = descricao.toLowerCase();
  for (const [setor, keywords] of Object.entries(KEYWORDS_SETOR)) {
    if (keywords.some((kw) => desc.includes(kw))) return setor;
  }
  return null;
}

interface AddNotaModalProps {
  onClose: () => void;
}

const AddNotaModal = ({ onClose }: AddNotaModalProps) => {
  const { addNota, uploadAttachment } = useNotas();
  const { log } = useAuditLog();

  const [form, setForm] = useState({
    numero: "",
    tipo: "fornecedor" as "servico" | "fornecedor",
    fornecedor: "",
    valor: "",
    setor: "",
    dataEmissao: "",
    dataVencimento: "",
    descricao: "",
  });

  const [sugestao, setSugestao] = useState<string | null>(null);
  const [setorFromHistory, setSetorFromHistory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [diaVencimento, setDiaVencimento] = useState(1);
  const { notas } = useNotas();

  const handleDescricaoChange = (value: string) => {
    const s = sugerirSetor(value);
    setForm((f) => ({ ...f, descricao: value, ...(s ? { setor: s } : {}) }));
    setSugestao(s);
  };

  const handleSetorSuggestion = (setor: string) => {
    setSetorFromHistory(setor);
    if (!form.setor) {
      setForm((f) => ({ ...f, setor }));
    }
  };

  const handleFileUpload = async (file: File) => {
    const isXML = file.name.endsWith(".xml");
    const isPDF = file.name.endsWith(".pdf");
    const isTXT = file.name.endsWith(".txt");

    if (!isXML && !isPDF && !isTXT) {
      toast.error("Formato não suportado. Use XML, PDF ou TXT.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo: 10MB.");
      return;
    }

    setAttachmentFile(file);
    setParsing(true);
    try {
      let content = "";
      let fileType = "text";

      if (isXML) {
        content = await file.text();
        fileType = "xml";
      } else if (isPDF) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        content = btoa(binary);
        fileType = "pdf_base64";
      } else {
        content = await file.text();
        fileType = "text";
      }

      const { data, error } = await supabase.functions.invoke("parse-nf", {
        body: { content, type: fileType },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const d = data.data;
        setForm({
          numero: d.numero || "",
          tipo: d.tipo === "servico" ? "servico" : "fornecedor",
          fornecedor: d.fornecedor || "",
          valor: d.valor ? String(d.valor) : "",
          setor: SETORES.includes(d.setor) ? d.setor : "",
          dataEmissao: d.dataEmissao || "",
          dataVencimento: d.dataVencimento || "",
          descricao: d.descricao || "",
        });
        toast.success("Dados extraídos com sucesso! Revise antes de salvar.");
      } else {
        toast.error(data?.error || "Não foi possível extrair dados do arquivo");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao processar arquivo. Tente novamente.");
    } finally {
      setParsing(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "xml", "jpg", "jpeg", "png"].includes(ext || "")) {
        toast.error("Apenas PDF, XML ou imagens podem ser anexados.");
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Arquivo muito grande. Máximo: 10MB.");
        return;
      }
      setAttachmentFile(file);
      toast.success(`Arquivo "${file.name}" será anexado à nota.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero || !form.fornecedor || !form.valor || !form.setor || !form.dataEmissao || !form.dataVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    const notaId = await addNota({
      numero: form.numero,
      tipo: form.tipo,
      fornecedor: form.fornecedor,
      valor: parseFloat(form.valor),
      setor: form.setor,
      dataEmissao: form.dataEmissao,
      dataVencimento: form.dataVencimento,
      status: "pendente",
      descricao: form.descricao,
    });

    if (notaId) {
      await log("criar", "nota_fiscal", notaId, { numero: form.numero, fornecedor: form.fornecedor, valor: form.valor });
      if (attachmentFile) {
        await uploadAttachment(notaId, attachmentFile);
      }
      if (isRecorrente) {
        await supabase.from("notas_recorrentes").insert({
          nota_base_id: notaId,
          user_id: (await supabase.auth.getUser()).data.user?.id || "",
          dia_vencimento: diaVencimento,
          ativa: true,
        });
      }
    }

    setSubmitting(false);
    toast.success("Nota fiscal adicionada!");
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all [-webkit-appearance:none] [appearance:none]";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-md sm:p-4" onClick={onClose}>
      <div
        className="bg-card border border-border/60 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="flex items-center justify-between p-5 sm:p-7 pb-0 sm:pb-0">
          <h3 className="text-lg font-bold text-foreground">Nova Nota Fiscal</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 sm:px-7 py-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
  );
};

export default AddNotaModal;
