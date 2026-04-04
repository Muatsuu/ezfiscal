import { useNotas } from "@/contexts/NFContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useState, useMemo } from "react";
import { Search, Trash2, SlidersHorizontal, X, Pencil, AlertTriangle, FileText, PlusCircle, LayoutGrid, List, SearchX } from "lucide-react";
import { SETORES } from "@/types/notaFiscal";
import EditNotaModal from "@/components/EditNotaModal";
import AddNotaModal from "@/components/AddNotaModal";
import { NotasListSkeleton, NotasTableSkeleton } from "@/components/NotasSkeleton";
import type { NotaFiscal } from "@/types/notaFiscal";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 30;

const NotasList = () => {
  const { notas, loading, removeNota, updateNota } = useNotas();
  const { log } = useAuditLog();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAddModal, setShowAddModal] = useState(false);
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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return notas.filter((n) => {
      const q = search.toLowerCase();
      const matchesSearch =
        n.fornecedor.toLowerCase().includes(q) ||
        n.numero.toLowerCase().includes(q) ||
        (n.descricao?.toLowerCase().includes(q));
      const matchesStatus = filterStatus === "todos" || n.status === filterStatus;
      const matchesSetor = filterSetor === "todos" || n.setor === filterSetor;
      const matchesDateFrom = !dateFrom || n.dataEmissao >= dateFrom;
      const matchesDateTo = !dateTo || n.dataEmissao <= dateTo;
      const matchesValorMin = !valorMin || n.valor >= parseFloat(valorMin);
      const matchesValorMax = !valorMax || n.valor <= parseFloat(valorMax);
      return matchesSearch && matchesStatus && matchesSetor && matchesDateFrom && matchesDateTo && matchesValorMin && matchesValorMax;
    });
  }, [notas, search, filterStatus, filterSetor, dateFrom, dateTo, valorMin, valorMax]);

  const paginatedNotas = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const activeFiltersCount = [
    filterStatus !== "todos", filterSetor !== "todos",
    !!dateFrom, !!dateTo, !!valorMin, !!valorMax,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus("todos"); setFilterSetor("todos");
    setDateFrom(""); setDateTo(""); setValorMin(""); setValorMax(""); setSearch("");
    setVisibleCount(PAGE_SIZE);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await removeNota(deleteTarget.id);
      await log("excluir", "nota_fiscal", deleteTarget.id, { numero: deleteTarget.numero, fornecedor: deleteTarget.fornecedor });
      toast.success("Nota fiscal excluída");
      setDeleteTarget(null);
    }
  };

  const handleConfirmPay = async () => {
    if (payTarget) {
      await updateNota(payTarget.id, { status: "paga" });
      await log("status_change", "nota_fiscal", payTarget.id, { de: "pendente", para: "paga", numero: payTarget.numero });
      toast.success("Nota marcada como paga");
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

  const statusBadge = (status: string) => {
    const cls = status === "paga"
      ? "bg-success/10 text-success"
      : status === "vencida"
      ? "bg-destructive/10 text-destructive"
      : "bg-warning/10 text-warning";
    return `text-[10px] font-medium px-2 py-0.5 rounded-full ${cls}`;
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          </div>
          <span className="truncate">Notas Fiscais</span>
        </h2>
        <div className="flex gap-2">
          {/* View mode toggle */}
          <div className="flex bg-secondary rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2.5 transition-all ${viewMode === "cards" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              title="Visualização em cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2.5 transition-all ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              title="Visualização em tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`relative p-2.5 rounded-xl transition-all ${
              showAdvanced || activeFiltersCount > 0
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por fornecedor, número ou CNPJ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilterStatus(f.value); setVisibleCount(PAGE_SIZE); }}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterStatus === f.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="glass-card rounded-2xl p-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Filtros avançados</span>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-destructive flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar todos
              </button>
            )}
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">Setor</label>
            <select value={filterSetor} onChange={(e) => { setFilterSetor(e.target.value); setVisibleCount(PAGE_SIZE); }} className={inputClass + " appearance-none"}>
              <option value="todos">Todos os setores</option>
              {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Emissão de</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }} className={inputClass + " text-xs"} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Até</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }} className={inputClass + " text-xs"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Valor mínimo</label>
              <input type="number" placeholder="R$ 0,00" value={valorMin} onChange={(e) => { setValorMin(e.target.value); setVisibleCount(PAGE_SIZE); }} className={inputClass + " text-xs"} min="0" step="0.01" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Valor máximo</label>
              <input type="number" placeholder="R$ 99.999" value={valorMax} onChange={(e) => { setValorMax(e.target.value); setVisibleCount(PAGE_SIZE); }} className={inputClass + " text-xs"} min="0" step="0.01" />
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-[11px] text-muted-foreground">
        {filtered.length} nota{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        {hasMore && ` · Mostrando ${visibleCount}`}
      </p>

      {/* Loading skeleton */}
      {loading ? (
        viewMode === "cards" ? <NotasListSkeleton /> : <NotasTableSkeleton />
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            {activeFiltersCount > 0 || search ? (
              <SearchX className="w-7 h-7 text-muted-foreground/30" />
            ) : (
              <FileText className="w-7 h-7 text-muted-foreground/30" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              {activeFiltersCount > 0 || search ? "Nenhum resultado encontrado" : "Nenhuma nota cadastrada"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              {activeFiltersCount > 0 || search
                ? "Tente ajustar os filtros ou a busca para encontrar o que procura."
                : "Cadastre sua primeira nota fiscal para começar a organizar suas finanças."}
            </p>
          </div>
          {activeFiltersCount > 0 || search ? (
            <button onClick={clearFilters} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </button>
          ) : (
            <button onClick={() => isMobile ? navigate("/adicionar") : setShowAddModal(true)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" /> Cadastrar nota fiscal
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* Card View */
        <div className="space-y-3">
          {paginatedNotas.map((nota) => (
            <div
              key={nota.id}
              className="glass-card rounded-2xl p-5 group hover-lift gradient-border animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      nota.tipo === "servico" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    }`}>
                      {nota.tipo === "servico" ? "Serviço" : "Fornecedor"}
                    </span>
                    <span className={statusBadge(nota.status)}>
                      {nota.status.charAt(0).toUpperCase() + nota.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{nota.fornecedor}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{nota.numero} · {nota.setor}</p>
                  {nota.descricao && <p className="text-[11px] text-muted-foreground mt-1 truncate">{nota.descricao}</p>}
                  <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
                    <span>Emissão: {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}</span>
                    <span>Venc: {new Date(nota.dataVencimento).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="text-right ml-3 flex flex-col items-end gap-2">
                  <p className="text-base font-bold text-foreground">{formatCurrency(nota.valor)}</p>
                  <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    {nota.status === "pendente" && (
                      <button onClick={() => setPayTarget(nota)} className="text-[10px] px-2.5 py-1 rounded-lg bg-success/10 text-success font-medium hover:bg-success/20 transition-colors">
                        Pagar
                      </button>
                    )}
                    <button onClick={() => setEditingNota(nota)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(nota)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Número</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Fornecedor</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Setor</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Emissão</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotas.map((nota) => (
                  <tr key={nota.id} className="border-b border-border/10 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground">{nota.numero}</td>
                    <td className="px-4 py-3 text-foreground truncate max-w-[200px]">{nota.fornecedor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{nota.setor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(nota.valor)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={statusBadge(nota.status)}>
                        {nota.status.charAt(0).toUpperCase() + nota.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{new Date(nota.dataVencimento).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {nota.status === "pendente" && (
                          <button onClick={() => setPayTarget(nota)} className="text-[10px] px-2 py-1 rounded-lg bg-success/10 text-success font-medium">
                            Pagar
                          </button>
                        )}
                        <button onClick={() => setEditingNota(nota)} className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteTarget(nota)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}

      {editingNota && <EditNotaModal nota={editingNota} onClose={() => setEditingNota(null)} />}
      {showAddModal && <AddNotaModal onClose={() => setShowAddModal(false)} />}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Excluir nota fiscal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a nota <strong>{deleteTarget?.numero}</strong> de <strong>{deleteTarget?.fornecedor}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Confirmation */}
      <AlertDialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar a nota <strong>{payTarget?.numero}</strong> de <strong>{payTarget?.fornecedor}</strong> ({payTarget && formatCurrency(payTarget.valor)}) como paga?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPay} className="bg-success text-success-foreground hover:bg-success/90">Confirmar Pagamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotasList;
