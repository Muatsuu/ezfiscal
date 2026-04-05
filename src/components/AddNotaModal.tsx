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

            {/* Upload AI */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => document.getElementById("nf-file-input")?.click()}
                disabled={parsing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando arquivo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar XML / PDF / TXT
                  </>
                )}
              </button>
              <input id="nf-file-input" type="file" accept=".xml,.pdf,.txt" onChange={onFileSelect} className="hidden" />
            </div>

            {/* Tipo */}
            <div className="flex gap-2">
              {(["fornecedor", "servico"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    form.tipo === tipo
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tipo === "fornecedor" ? "Fornecedor" : "Serviço"}
                </button>
              ))}
            </div>

            <input placeholder="Número da NF *" value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} className={inputClass} />

            {/* Duplicate Warning */}
            <DuplicateWarning numero={form.numero} fornecedor={form.fornecedor} notas={notas} />

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Fornecedor / Prestador *</label>
              <FornecedorCombobox
                value={form.fornecedor}
                onChange={(nome) => {
                  setForm((f) => ({ ...f, fornecedor: nome }));
                  const existingNotas = notas.filter((n) => n.fornecedor === nome);
                  if (existingNotas.length > 0) {
                    const lastSetor = existingNotas[existingNotas.length - 1].setor;
                    handleSetorSuggestion(lastSetor);
                  }
                }}
                className={inputClass}
              />
              {setorFromHistory && !sugestao && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, setor: setorFromHistory }))}
                  className="mt-1 flex items-center gap-1.5 text-[11px] text-primary/80 hover:text-primary"
                >
                  <Sparkles className="w-3 h-3" />
                  Último setor usado: {setorFromHistory}
                </button>
              )}
            </div>

            <input type="number" step="0.01" placeholder="Valor (R$) *" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className={inputClass} />

            {/* Descrição */}
            <div className="space-y-2">
              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => handleDescricaoChange(e.target.value)}
                rows={2}
                className={inputClass + " resize-none"}
              />
              {sugestao && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, setor: sugestao }))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium animate-fade-in"
                >
                  <Sparkles className="w-3 h-3" />
                  Sugestão: {sugestao} — clique para aplicar
                </button>
              )}
            </div>

            {/* Setor */}
            <select value={form.setor} onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))} className={inputClass + " appearance-none"}>
              <option value="">Selecione o setor *</option>
              {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 overflow-hidden">
              <div className="min-w-0 overflow-hidden">
                <label className="text-xs text-muted-foreground mb-1 block">Emissão *</label>
                <input type="date" value={form.dataEmissao} onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))} className={inputClass + " min-w-0 max-w-full text-xs box-border"} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <label className="text-xs text-muted-foreground mb-1 block">Vencimento *</label>
                <input type="date" value={form.dataVencimento} onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))} className={inputClass + " min-w-0 max-w-full text-xs box-border"} />
              </div>
            </div>

            {/* Attachment section */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">Anexo PDF/XML/Imagem</label>
              {attachmentFile ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                  <FileCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{attachmentFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => setAttachmentFile(null)} className="text-xs text-destructive hover:underline flex-shrink-0">Remover</button>
                </div>
              ) : (
                <button type="button" onClick={() => document.getElementById("attachment-input")?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  Anexar arquivo
                </button>
              )}
              <input id="attachment-input" type="file" accept=".pdf,.xml,.jpg,.jpeg,.png" onChange={onAttachmentSelect} className="hidden" />
            </div>

            {/* Recorrente toggle */}
            <div className="space-y-3 pt-2 border-t border-border/20">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${isRecorrente ? "bg-primary" : "bg-secondary"}`} onClick={() => setIsRecorrente(!isRecorrente)}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isRecorrente ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground font-medium">Nota recorrente (mensal)</span>
                </div>
              </label>
              {isRecorrente && (
                <div className="flex items-center gap-3 pl-1 animate-fade-in">
                  <label className="text-xs text-muted-foreground">Dia do vencimento:</label>
                  <input type="number" min="1" max="28" value={diaVencimento} onChange={(e) => setDiaVencimento(Number(e.target.value))} className="w-16 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer buttons */}
          <div className="flex gap-3 p-5 sm:px-7 sm:pb-7 pt-3 border-t border-border/30 bg-card rounded-b-2xl flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm disabled:opacity-50 shadow-lg glow-primary hover:shadow-xl hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Adicionar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNotaModal;
