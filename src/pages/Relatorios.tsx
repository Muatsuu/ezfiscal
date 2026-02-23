import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { FileDown, Calendar } from "lucide-react";
import { toast } from "sonner";

const Relatorios = () => {
  const { notas } = useNotas();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBy, setFilterBy] = useState<"emissao" | "vencimento">("emissao");

  const filtered = useMemo(() => {
    return notas.filter((n) => {
      const date = filterBy === "emissao" ? n.dataEmissao : n.dataVencimento;
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      return true;
    });
  }, [notas, dateFrom, dateTo, filterBy]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, n) => sum + n.valor, 0);
    const porSetor = filtered.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    return { total, porSetor, count: filtered.length };
  }, [filtered]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const exportCSV = () => {
    const headers = "Número,Tipo,Fornecedor,Valor,Setor,Emissão,Vencimento,Status\n";
    const rows = filtered
      .map(
        (n) =>
          `${n.numero},${n.tipo},${n.fornecedor},${n.valor},${n.setor},${n.dataEmissao},${n.dataVencimento},${n.status}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-nfs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">Relatórios</h2>

      {/* Filter by */}
      <div className="flex gap-2">
        {(["emissao", "vencimento"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterBy(f)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filterBy === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f === "emissao" ? "Data de Emissão" : "Data de Vencimento"}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total no período</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{stats.count} NFs</span>
          </div>
        </div>

        {/* Por setor */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Por setor
          </p>
          {Object.entries(stats.porSetor)
            .sort(([, a], [, b]) => b - a)
            .map(([setor, valor]) => (
              <div key={setor} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{setor}</span>
                <span className="font-semibold text-foreground">{formatCurrency(valor)}</span>
              </div>
            ))}
          {Object.keys(stats.porSetor).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum dado no período selecionado
            </p>
          )}
        </div>
      </div>

      {/* Export */}
      <button
        onClick={exportCSV}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform"
      >
        <FileDown className="w-4 h-4" />
        Exportar CSV / Excel
      </button>
    </div>
  );
};

export default Relatorios;
