import { useNotas } from "@/contexts/NFContext";
import { useState, useMemo } from "react";
import { Search, Filter, Trash2, SlidersHorizontal, X, Pencil, AlertTriangle } from "lucide-react";
import { SETORES } from "@/types/notaFiscal";
import EditNotaModal from "@/components/EditNotaModal";
import type { NotaFiscal } from "@/types/notaFiscal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const NotasList = () => {
  const { notas, removeNota, updateNota } = useNotas();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterSetor, setFilterSetor] = useState<string>("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotaFiscal | null>(null);
  const [payTarget, setPayTarget] = useState<NotaFiscal | null>(null);

  const filtered = useMemo(() => {
    return notas.filter((n) => {
      const matchesSearch =
        n.fornecedor.toLowerCase().includes(search.toLowerCase()) ||
        n.numero.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "todos" || n.status === filterStatus;
      const matchesSetor = filterSetor === "todos" || n.setor === filterSetor;
      const matchesDateFrom = !dateFrom || n.dataEmissao >= dateFrom;
      const matchesDateTo = !dateTo || n.dataEmissao <= dateTo;
      const matchesValorMin = !valorMin || n.valor >= parseFloat(valorMin);
      const matchesValorMax = !valorMax || n.valor <= parseFloat(valorMax);
      return matchesSearch && matchesStatus && matchesSetor && matchesDateFrom && matchesDateTo && matchesValorMin && matchesValorMax;
    });
  }, [notas, search, filterStatus, filterSetor, dateFrom, dateTo, valorMin, valorMax]);

  const activeFiltersCount = [
    filterStatus !== "todos",
    filterSetor !== "todos",
    !!dateFrom,
    !!dateTo,
    !!valorMin,
    !!valorMax,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus("todos");
    setFilterSetor("todos");
    setDateFrom("");
    setDateTo("");
    setValorMin("");
    setValorMax("");
    setSearch("");
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      removeNota(deleteTarget.id);
      toast.success("Nota fiscal excluída com sucesso");
      setDeleteTarget(null);
    }
  };

  const handleConfirmPay = () => {
    if (payTarget) {
      updateNota(payTarget.id, { status: "paga" });
      toast.success("Nota fiscal marcada como paga");
      setPayTarget(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const statusFilters = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendentes" },
    { value: "paga", label: "Pagas" },
    { value: "vencida", label: "Vencidas" },
  ];

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Notas Fiscais</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`relative p-2 rounded-xl transition-all ${
            showAdvanced || activeFiltersCount > 0
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por fornecedor ou número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Status Filters */}
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

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="glass-card rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Filtros avançados</span>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-destructive flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Setor</label>
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className={inputClass + " appearance-none"}
            >
              <option value="todos">Todos os setores</option>
              {SETORES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Emissão de</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass + " text-xs"}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass + " text-xs"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor mínimo</label>
              <input
                type="number"
                placeholder="R$ 0,00"
                value={valorMin}
                onChange={(e) => setValorMin(e.target.value)}
                className={inputClass + " text-xs"}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor máximo</label>
              <input
                type="number"
                placeholder="R$ 99.999"
                value={valorMax}
                onChange={(e) => setValorMax(e.target.value)}
                className={inputClass + " text-xs"}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} nota{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
      </p>

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
                        onClick={() => setPayTarget(nota)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-success/10 text-success font-medium"
                      >
                        Pagar
                      </button>
                    )}
                    <button
                      onClick={() => setEditingNota(nota)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary"
                      title="Editar nota"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(nota)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive"
                      title="Excluir nota"
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

      {editingNota && (
        <EditNotaModal nota={editingNota} onClose={() => setEditingNota(null)} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Excluir nota fiscal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a nota <strong>{deleteTarget?.numero}</strong> de{" "}
              <strong>{deleteTarget?.fornecedor}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Confirmation */}
      <AlertDialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar a nota <strong>{payTarget?.numero}</strong> de{" "}
              <strong>{payTarget?.fornecedor}</strong> ({payTarget && formatCurrency(payTarget.valor)}) como paga?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPay}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotasList;
