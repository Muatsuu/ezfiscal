import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { FileDown, FileText, BarChart3, RefreshCw, TrendingUp, Settings2 } from "lucide-react";
import { SETORES } from "@/types/notaFiscal";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid, Area, AreaChart,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const SECTOR_COLORS: Record<string, string> = {
  "Administrativo": "hsl(207, 90%, 54%)",
  "Manutenção": "hsl(36, 100%, 50%)",
  "Cozinha": "hsl(152, 60%, 42%)",
  "GOV.": "hsl(280, 60%, 55%)",
  "A&B": "hsl(0, 72%, 55%)",
  "Serviços Gerais": "hsl(200, 70%, 50%)",
  "Não Identificado": "hsl(215, 12%, 48%)",
};

const periodFilters = [
  { value: "month", label: "Este mês" },
  { value: "last-month", label: "Mês anterior" },
  { value: "3months", label: "3 meses" },
  { value: "6months", label: "6 meses" },
];

const Relatorios = () => {
  const { notas } = useNotas();
  const [period, setPeriod] = useState("month");

  const ALL_COLUMNS = [
    { key: "numero", label: "Número" },
    { key: "tipo", label: "Tipo" },
    { key: "fornecedor", label: "Fornecedor" },
    { key: "valor", label: "Valor" },
    { key: "setor", label: "Setor" },
    { key: "dataEmissao", label: "Emissão" },
    { key: "dataVencimento", label: "Vencimento" },
    { key: "status", label: "Status" },
    { key: "descricao", label: "Descrição" },
  ] as const;

  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key)
  );
  const [showExportDialog, setShowExportDialog] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    if (period === "last-month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return notas.filter((n) => {
        const d = new Date(n.dataEmissao);
        return d >= startDate && d <= endDate;
      });
    }
    if (period === "3months") startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (period === "6months") startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    return notas.filter((n) => new Date(n.dataEmissao) >= startDate);
  }, [notas, period]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, n) => sum + n.valor, 0);
    const pagas = filtered.filter((n) => n.status === "paga");
    const pendentes = filtered.filter((n) => n.status === "pendente" || n.status === "vencida");
    const totalPago = pagas.reduce((sum, n) => sum + n.valor, 0);
    const totalPendente = pendentes.reduce((sum, n) => sum + n.valor, 0);
    const ticketMedio = filtered.length > 0 ? total / filtered.length : 0;

    // Monthly bar data
    const porMesMap = filtered.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const comparativoMensal = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => {
        const [, m] = mes.split("-");
        return { mes: monthNames[parseInt(m) - 1], valor };
      });

    // Sector pie
    const porSetorMap = filtered.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const sectorPie = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({
        name: setor,
        value: valor,
        color: SECTOR_COLORS[setor] || "hsl(207, 90%, 54%)",
      }));

    // Volume per month (count)
    const volumeMap = filtered.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const volumeMensal = Object.entries(volumeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => {
        const [, m] = mes.split("-");
        return { mes: monthNames[parseInt(m) - 1], count };
      });

    return { total, totalPago, totalPendente, ticketMedio, comparativoMensal, sectorPie, volumeMensal };
  }, [filtered]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const now = new Date();
  const periodLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const colMap: Record<string, (n: any) => string> = {
      numero: (n) => `"${n.numero}"`,
      tipo: (n) => `"${n.tipo}"`,
      fornecedor: (n) => `"${n.fornecedor}"`,
      valor: (n) => String(n.valor),
      setor: (n) => `"${n.setor}"`,
      dataEmissao: (n) => `"${n.dataEmissao}"`,
      dataVencimento: (n) => `"${n.dataVencimento}"`,
      status: (n) => `"${n.status}"`,
      descricao: (n) => `"${n.descricao || ""}"`,
    };
    const headers = selectedColumns.map((k) => ALL_COLUMNS.find((c) => c.key === k)?.label || k).join(",") + "\n";
    const rows = filtered.map((n) =>
      selectedColumns.map((k) => colMap[k]?.(n) || "").join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-nfs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
    setShowExportDialog(false);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2.5 shadow-xl text-xs">
          <p className="text-muted-foreground mb-1">{label}</p>
          <p className="text-primary font-bold text-sm">{typeof payload[0].value === "number" && payload[0].value > 100 ? formatCurrency(payload[0].value) : payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors">
                <Settings2 className="w-4 h-4" />
                Exportar
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Exportar Relatório</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Selecione as colunas para exportar:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        selectedColumns.includes(col.key)
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          selectedColumns.includes(col.key)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedColumns.includes(col.key) && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {col.label}
                    </label>
                  ))}
                </div>
                <button
                  onClick={exportCSV}
                  disabled={selectedColumns.length === 0}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  Exportar CSV ({selectedColumns.length} colunas)
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {periodFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setPeriod(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              period === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total</p>
          <p className="text-lg lg:text-xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pago</p>
          <p className="text-lg lg:text-xl font-bold text-success">{formatCurrency(stats.totalPago)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pendente</p>
          <p className="text-lg lg:text-xl font-bold text-warning">{formatCurrency(stats.totalPendente)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ticket Médio</p>
          <p className="text-lg lg:text-xl font-bold text-primary">{formatCurrency(stats.ticketMedio)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Comparativo Mensal */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Comparativo Mensal
          </h3>
          {stats.comparativoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.comparativoMensal} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 18%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(215, 12%, 48%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={30} fill="hsl(207, 90%, 54%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-16">Sem dados</p>
          )}
        </div>

        {/* Distribuição por Setor */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-accent" />
            Distribuição por Setor
          </h3>
          {stats.sectorPie.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.sectorPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.sectorPie.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {stats.sectorPie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-16">Sem dados</p>
          )}
        </div>
      </div>

      {/* Volume de Notas */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Volume de Notas por Mês
        </h3>
        {stats.volumeMensal.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.volumeMensal} margin={{ left: 0, right: 10 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 18%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(215, 12%, 48%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="hsl(207, 90%, 54%)" strokeWidth={2} fill="url(#colorVolume)" dot={{ r: 4, fill: "hsl(207, 90%, 54%)", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-12">Sem dados</p>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
