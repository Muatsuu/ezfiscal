import { useNotas } from "@/contexts/NFContext";
import { useState } from "react";
import { Search, Filter, Trash2 } from "lucide-react";

const NotasList = () => {
  const { notas, removeNota, updateNota } = useNotas();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const filtered = notas.filter((n) => {
    const matchesSearch =
      n.fornecedor.toLowerCase().includes(search.toLowerCase()) ||
      n.numero.toLowerCase().includes(search.toLowerCase()) ||
      n.setor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || n.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const statusFilters = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendentes" },
    { value: "paga", label: "Pagas" },
    { value: "vencida", label: "Vencidas" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Notas Fiscais</h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por fornecedor, número ou setor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterStatus === f.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma nota encontrada</p>
          </div>
        ) : (
          filtered.map((nota) => (
            <div
              key={nota.id}
              className="glass-card rounded-xl p-4 animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        nota.tipo === "servico"
                          ? "bg-accent/10 text-accent"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {nota.tipo === "servico" ? "Serviço" : "Fornecedor"}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        nota.status === "paga"
                          ? "bg-success/10 text-success"
                          : nota.status === "vencida"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {nota.status.charAt(0).toUpperCase() + nota.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {nota.fornecedor}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nota.numero} · {nota.setor}
                  </p>
                  {nota.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {nota.descricao}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Emissão: {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}</span>
                    <span>Venc: {new Date(nota.dataVencimento).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="text-right ml-3 flex flex-col items-end gap-2">
                  <p className="text-base font-bold text-foreground">
                    {formatCurrency(nota.valor)}
                  </p>
                  <div className="flex gap-1">
                    {nota.status === "pendente" && (
                      <button
                        onClick={() => updateNota(nota.id, { status: "paga" })}
                        className="text-[10px] px-2 py-1 rounded-lg bg-success/10 text-success font-medium"
                      >
                        Pagar
                      </button>
                    )}
                    <button
                      onClick={() => removeNota(nota.id)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotasList;
