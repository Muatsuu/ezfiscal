import { useState } from "react";
import { useNotas } from "@/contexts/NFContext";
import { SETORES } from "@/types/notaFiscal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Upload, Loader2, Paperclip, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const AddNota = () => {
  const { addNota, uploadAttachment } = useNotas();
  const navigate = useNavigate();

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
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const handleDescricaoChange = (value: string) => {
    const s = sugerirSetor(value);
    setForm((f) => ({ ...f, descricao: value, ...(s ? { setor: s } : {}) }));
    setSugestao(s);
  };

  const handleFileUpload = async (file: File) => {
    const isXML = file.name.endsWith(".xml");
    const isPDF = file.name.endsWith(".pdf");
    const isTXT = file.name.endsWith(".txt");

    if (!isXML && !isPDF && !isTXT) {
      toast.error("Formato não suportado. Use XML, PDF ou TXT.");
      return;
    }

    // Auto-attach the file
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "xml"].includes(ext || "")) {
        toast.error("Apenas PDF ou XML podem ser anexados.");
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

    if (notaId && attachmentFile) {
      await uploadAttachment(notaId, attachmentFile);
    }

    setSubmitting(false);
    toast.success("Nota fiscal adicionada!");
    navigate("/notas");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all [-webkit-appearance:none] [appearance:none]";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">Nova Nota Fiscal</h2>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xml,.pdf,.txt"
          onChange={onFileSelect}
          className="hidden"
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-primary font-medium">Processando com IA...</p>
            <p className="text-xs text-muted-foreground">Extraindo dados da nota fiscal</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Arraste um arquivo ou toque para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              XML, PDF ou TXT · A IA preenche os campos automaticamente
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">XML</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">PDF</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">TXT</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-2">
          {(["fornecedor", "servico"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setForm((f) => ({ ...f, tipo }))}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                form.tipo === tipo
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {tipo === "fornecedor" ? "Fornecedor" : "Serviço"}
            </button>
          ))}
        </div>

        <input placeholder="Número da NF *" value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} className={inputClass} />
        <input placeholder="Fornecedor / Prestador *" value={form.fornecedor} onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))} className={inputClass} />
        <input type="number" step="0.01" placeholder="Valor (R$) *" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className={inputClass} />

        {/* Descrição com IA */}
        <div className="space-y-2">
          <textarea
            placeholder="Descrição (a IA sugere o setor automaticamente)"
            value={form.descricao}
            onChange={(e) => handleDescricaoChange(e.target.value)}
            rows={2}
            className={inputClass + " resize-none"}
          />
          {sugestao && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium animate-fade-in">
              <Sparkles className="w-3 h-3" />
              Setor sugerido: {sugestao} ✓
            </div>
          )}
        </div>

        {/* Setor */}
        <select
          value={form.setor}
          onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))}
          className={inputClass + " appearance-none"}
        >
          <option value="">Selecione o setor *</option>
          {SETORES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3 overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <label className="text-xs text-muted-foreground mb-1 block">Emissão *</label>
            <input
              type="date"
              value={form.dataEmissao}
              onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))}
              className={inputClass + " min-w-0 max-w-full text-xs box-border"}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <label className="text-xs text-muted-foreground mb-1 block">Vencimento *</label>
            <input
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))}
              className={inputClass + " min-w-0 max-w-full text-xs box-border"}
            />
          </div>
        </div>

        {/* Attachment section */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Anexar PDF/XML (opcional)</label>
          {attachmentFile ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/20">
              <FileCheck className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{attachmentFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentFile(null)}
                className="text-xs text-destructive hover:underline flex-shrink-0"
              >
                Remover
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById("attachment-input")?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              Anexar arquivo
            </button>
          )}
          <input
            id="attachment-input"
            type="file"
            accept=".pdf,.xml"
            onChange={onAttachmentSelect}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Adicionar Nota Fiscal"}
        </button>
      </form>
    </div>
  );
};

export default AddNota;
