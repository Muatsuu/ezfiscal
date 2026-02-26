import { useState, useEffect } from "react";
import { NotaFiscal, SETORES } from "@/types/notaFiscal";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNotas } from "@/contexts/NFContext";

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

interface EditNotaModalProps {
  nota: NotaFiscal;
  onClose: () => void;
}

const EditNotaModal = ({ nota, onClose }: EditNotaModalProps) => {
  const { updateNota } = useNotas();
  const [form, setForm] = useState({
    numero: nota.numero,
    tipo: nota.tipo,
    fornecedor: nota.fornecedor,
    valor: String(nota.valor),
    setor: nota.setor,
    dataEmissao: nota.dataEmissao,
    dataVencimento: nota.dataVencimento,
    status: nota.status,
    descricao: nota.descricao || "",
  });
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDescricaoChange = (value: string) => {
    const s = sugerirSetor(value);
    setForm((f) => ({ ...f, descricao: value }));
    setSugestao(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero || !form.fornecedor || !form.valor || !form.setor || !form.dataEmissao || !form.dataVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    await updateNota(nota.id, {
      numero: form.numero,
      tipo: form.tipo as "servico" | "fornecedor",
      fornecedor: form.fornecedor,
      valor: parseFloat(form.valor),
      setor: form.setor,
      dataEmissao: form.dataEmissao,
      dataVencimento: form.dataVencimento,
      status: form.status as "pendente" | "paga" | "vencida",
      descricao: form.descricao || undefined,
    });
    setSubmitting(false);
    toast.success("Nota fiscal atualizada!");
    onClose();
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Editar Nota Fiscal</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
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

          {/* Status */}
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "pendente" | "paga" | "vencida" }))} className={inputClass + " appearance-none"}>
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="vencida">Vencida</option>
          </select>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Emissão *</label>
              <input type="date" value={form.dataEmissao} onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))} className={inputClass + " text-xs"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vencimento *</label>
              <input type="date" value={form.dataVencimento} onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))} className={inputClass + " text-xs"} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNotaModal;
