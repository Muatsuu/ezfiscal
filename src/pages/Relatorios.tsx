import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { FileDown, Calendar, FileSpreadsheet } from "lucide-react";
import { SETORES } from "@/types/notaFiscal";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(170, 65%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(120, 50%, 45%)",
];

const Relatorios = () => {
  const { notas } = useNotas();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBy, setFilterBy] = useState<"emissao" | "vencimento">("emissao");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterSetor, setFilterSetor] = useState<string>("todos");

  const filtered = useMemo(() => {
    return notas.filter((n) => {
      const date = filterBy === "emissao" ? n.dataEmissao : n.dataVencimento;
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      if (filterStatus !== "todos" && n.status !== filterStatus) return false;
      if (filterSetor !== "todos" && n.setor !== filterSetor) return false;
      return true;
    });
  }, [notas, dateFrom, dateTo, filterBy, filterStatus, filterSetor]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, n) => sum + n.valor, 0);
    const porSetorMap = filtered.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);

    const porSetorData = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ setor, valor }));

    const pendentes = filtered.filter((n) => n.status === "pendente").length;
    const pagas = filtered.filter((n) => n.status === "paga").length;
    const vencidas = filtered.filter((n) => n.status === "vencida").length;

    return { total, porSetorData, count: filtered.length, pendentes, pagas, vencidas };
  }, [filtered]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const headers = "Número,Tipo,Fornecedor,Valor,Setor,Emissão,Vencimento,Status,Descrição\n";
    const rows = filtered
      .map(
        (n) =>
          `"${n.numero}","${n.tipo}","${n.fornecedor}",${n.valor},"${n.setor}","${n.dataEmissao}","${n.dataVencimento}","${n.status}","${n.descricao || ""}"`
      )
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-nfs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado!");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-primary font-semibold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">Relatórios</h2>

      {/* Filter by date type */}
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

      {/* Extra filters */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputClass + " appearance-none"}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
            <option value="vencida">Vencidas</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Setor</label>
          <select
            value={filterSetor}
            onChange={(e) => setFilterSetor(e.target.value)}
            className={inputClass + " appearance-none"}
          >
            <option value="todos">Todos</option>
            {SETORES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.pendentes}</p>
          <p className="text-[10px] text-warning font-medium">Pendentes</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.pagas}</p>
          <p className="text-[10px] text-success font-medium">Pagas</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.vencidas}</p>
          <p className="text-[10px] text-destructive font-medium">Vencidas</p>
        </div>
      </div>

      {/* Total */}
      <div className="glass-card rounded-2xl p-5">
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
      </div>

      {/* Chart */}
      {stats.porSetorData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Gastos por Setor
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.porSetorData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="setor"
                type="category"
                width={100}
                tick={{ fontSize: 11, fill: "hsl(215, 10%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={16}>
                {stats.porSetorData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
