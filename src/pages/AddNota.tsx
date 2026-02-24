import { useState } from "react";
import { useNotas } from "@/contexts/NFContext";
import { SETORES } from "@/types/notaFiscal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const KEYWORDS_SETOR: Record<string, string[]> = {
  TI: ["software", "licença", "computador", "sistema", "servidor", "cloud", "tecnologia", "ti"],
  "RH": ["salário", "folha", "benefício", "treinamento", "rh", "recursos humanos"],
  Manutenção: ["limpeza", "manutenção", "reparo", "conserto", "pintura"],
  Administrativo: ["escritório", "material", "papelaria", "expediente"],
  Bar: ["Bebidas", "Comida", "Café", "Chocolate", "Salgadinho"],
  Escritorio: ["Caneto", "Papel"],
  Jurídico: ["advocacia", "jurídico", "contrato", "legal"],
};

function sugerirSetor(descricao: string): string | null {
  const desc = descricao.toLowerCase();
  for (const [setor, keywords] of Object.entries(KEYWORDS_SETOR)) {
    if (keywords.some((kw) => desc.includes(kw))) return setor;
  }
  return null;
}

const AddNota = () => {
  const { addNota } = useNotas();
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

  const handleDescricaoChange = (value: string) => {
    const s = sugerirSetor(value);
    setForm((f) => ({ ...f, descricao: value, ...(s ? { setor: s } : {}) }));
    setSugestao(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero || !form.fornecedor || !form.valor || !form.setor || !form.dataEmissao || !form.dataVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    await addNota({
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
    setSubmitting(false);
    toast.success("Nota fiscal adicionada!");
    navigate("/notas");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">Nova Nota Fiscal</h2>

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

        <input
          placeholder="Número da NF *"
          value={form.numero}
          onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
          className={inputClass}
        />

        <input
          placeholder="Fornecedor / Prestador *"
          value={form.fornecedor}
          onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))}
          className={inputClass}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Valor (R$) *"
          value={form.valor}
          onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
          className={inputClass}
        />

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
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground mb-1 block">Emissão *</label>
            <input
              type="date"
              value={form.dataEmissao}
              onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))}
              className={inputClass + " w-full min-w-0 text-xs"}
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground mb-1 block">Vencimento *</label>
            <input
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))}
              className={inputClass + " w-full min-w-0 text-xs"}
            />
          </div>
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
