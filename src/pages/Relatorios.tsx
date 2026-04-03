import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import {
  FileDown, BarChart3, TrendingUp, Settings2, PlusCircle,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  DollarSign, Hash, Download, Columns,
} from "lucide-react";
import { SETORES } from "@/types/notaFiscal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid, Area, AreaChart,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SECTOR_COLORS: Record<string, string> = {
  "Administrativo": "hsl(210, 100%, 60%)",
  "Manutenção": "hsl(38, 90%, 55%)",
  "Cozinha": "hsl(158, 55%, 45%)",
  "GOV.": "hsl(270, 55%, 58%)",
  "A&B": "hsl(0, 65%, 52%)",
  "Operações": "hsl(200, 65%, 55%)",
  "Serviços Gerais": "hsl(190, 60%, 50%)",
  "Não Identificado": "hsl(215, 12%, 45%)",
};

const periodFilters = [
  { value: "month", label: "Este mês" },
  { value: "last-month", label: "Mês anterior" },
  { value: "3months", label: "3 meses" },
  { value: "6months", label: "6 meses" },
  { value: "year", label: "Este ano" },
];

const Relatorios = () => {
  const { notas } = useNotas();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState("month");

  const ALL_COLUMNS = [
    { key: "numero", label: "Número" }, { key: "tipo", label: "Tipo" },
    { key: "fornecedor", label: "Fornecedor" }, { key: "valor", label: "Valor" },
    { key: "setor", label: "Setor" }, { key: "dataEmissao", label: "Emissão" },
    { key: "dataVencimento", label: "Vencimento" }, { key: "status", label: "Status" },
    { key: "descricao", label: "Descrição" },
  ] as const;

  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS.map((c) => c.key));
  const [showExportDialog, setShowExportDialog] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "last-month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return notas.filter((n) => { const d = new Date(n.dataEmissao); return d >= startDate && d <= endDate; });
    }
    if (period === "3months") startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (period === "6months") startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    if (period === "year") startDate = new Date(now.getFullYear(), 0, 1);
    return notas.filter((n) => new Date(n.dataEmissao) >= startDate);
  }, [notas, period]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, n) => sum + n.valor, 0);
    const pagas = filtered.filter((n) => n.status === "paga");
    const pendentes = filtered.filter((n) => n.status === "pendente" || n.status === "vencida");
    const totalPago = pagas.reduce((sum, n) => sum + n.valor, 0);
    const totalPendente = pendentes.reduce((sum, n) => sum + n.valor, 0);
    const ticketMedio = filtered.length > 0 ? total / filtered.length : 0;
    const taxaPagamento = filtered.length > 0 ? (pagas.length / filtered.length) * 100 : 0;

    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    const porMesMap = filtered.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const comparativoMensal = Object.entries(porMesMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ mes: monthNames[parseInt(mes.split("-")[1]) - 1], valor }));

    const porSetorMap = filtered.reduce((acc, n) => { acc[n.setor] = (acc[n.setor] || 0) + n.valor; return acc; }, {} as Record<string, number>);
    const sectorPie = Object.entries(porSetorMap).sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ name: setor, value: valor, color: SECTOR_COLORS[setor] || "hsl(210, 100%, 60%)" }));

    const volumeMap = filtered.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + 1; return acc;
    }, {} as Record<string, number>);
    const volumeMensal = Object.entries(volumeMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => ({ mes: monthNames[parseInt(mes.split("-")[1]) - 1], count }));

    // Top fornecedores
    const fornecedorMap = filtered.reduce((acc, n) => {
      acc[n.fornecedor] = (acc[n.fornecedor] || 0) + n.valor; return acc;
    }, {} as Record<string, number>);
    const topFornecedores = Object.entries(fornecedorMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor, pct: total > 0 ? (valor / total) * 100 : 0 }));

    return { total, totalPago, totalPendente, ticketMedio, taxaPagamento, comparativoMensal, sectorPie, volumeMensal, topFornecedores };
  }, [filtered]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const now = new Date();
  const periodLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const colMap: Record<string, (n: any) => string> = {
      numero: (n) => `"${n.numero}"`, tipo: (n) => `"${n.tipo}"`,
      fornecedor: (n) => `"${n.fornecedor}"`, valor: (n) => String(n.valor),
      setor: (n) => `"${n.setor}"`, dataEmissao: (n) => `"${n.dataEmissao}"`,
      dataVencimento: (n) => `"${n.dataVencimento}"`, status: (n) => `"${n.status}"`,
      descricao: (n) => `"${n.descricao || ""}"`,
    };
    const headers = selectedColumns.map((k) => ALL_COLUMNS.find((c) => c.key === k)?.label || k).join(",") + "\n";
    const rows = filtered.map((n) => selectedColumns.map((k) => colMap[k]?.(n) || "").join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `relatorio-nfs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Relatório exportado!"); setShowExportDialog(false);
  };

  const exportExcel = () => {
    if (filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const colMap: Record<string, (n: any) => string> = {
      numero: (n) => n.numero, tipo: (n) => n.tipo,
      fornecedor: (n) => n.fornecedor, valor: (n) => String(n.valor),
      setor: (n) => n.setor, dataEmissao: (n) => n.dataEmissao,
      dataVencimento: (n) => n.dataVencimento, status: (n) => n.status,
      descricao: (n) => n.descricao || "",
    };
    const headers = selectedColumns.map((k) => ALL_COLUMNS.find((c) => c.key === k)?.label || k);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Worksheet ss:Name="Relatório"><Table>\n';
    xml += '<Row>' + headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("") + '</Row>\n';
    filtered.forEach((n) => {
      xml += '<Row>' + selectedColumns.map((k) => {
        const val = colMap[k]?.(n) || "";
        const type = k === "valor" ? "Number" : "String";
        return `<Cell><Data ss:Type="${type}">${val}</Data></Cell>`;
      }).join("") + '</Row>\n';
    });
    xml += '</Table></Worksheet></Workbook>';
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `relatorio-nfs-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Excel exportado!");
    setShowExportDialog(false);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card-elevated rounded-xl p-3 text-xs border border-border/60">
          <p className="text-muted-foreground mb-1">{label}</p>
          <p className="text-primary font-bold text-sm">
            {typeof payload[0].value === "number" && payload[0].value > 100
              ? formatCurrency(payload[0].value) : payload[0].value}
          </p>
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
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            Relatórios
          </h2>
          <p className="text-[11px] text-muted-foreground capitalize mt-1 ml-[52px] tracking-wide">
            {filtered.length} notas no período · {periodLabel}
          </p>
        </div>
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-success/80 to-success text-success-foreground text-xs font-semibold hover:brightness-110 transition-all shadow-md self-start">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm animate-scale-in">
            <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Columns className="w-4 h-4 text-primary" /> Exportar Relatório</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Selecione as colunas:</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    selectedColumns.includes(col.key) ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    <input type="checkbox" checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                      selectedColumns.includes(col.key) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}>
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
              <button onClick={exportCSV} disabled={selectedColumns.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                Exportar ({selectedColumns.length} colunas)
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Period pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {periodFilters.map((f) => (
          <button key={f.value} onClick={() => setPeriod(f.value)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              period === f.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stat Cards — 5 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: formatCurrency(stats.total), icon: DollarSign, colorClass: "text-foreground", gradient: "from-primary/5 to-transparent" },
          { label: "Pago", value: formatCurrency(stats.totalPago), icon: ArrowDownRight, colorClass: "text-success", gradient: "from-success/5 to-transparent" },
          { label: "Pendente", value: formatCurrency(stats.totalPendente), icon: ArrowUpRight, colorClass: "text-warning", gradient: "from-warning/5 to-transparent" },
          { label: "Ticket Médio", value: formatCurrency(stats.ticketMedio), icon: Hash, colorClass: "text-primary", gradient: "from-primary/5 to-transparent" },
          { label: "Taxa Pgto.", value: `${stats.taxaPagamento.toFixed(0)}%`, icon: TrendingUp, colorClass: "text-success", gradient: "from-success/5 to-transparent" },
        ].map((card) => (
          <div key={card.label} className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${card.gradient} hover-lift`}>
            <div className="flex items-center gap-1.5 mb-2">
              <card.icon className={`w-3.5 h-3.5 ${card.colorClass}`} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
            </div>
            <p className={`text-lg lg:text-xl font-bold font-mono ${card.colorClass}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Comparativo Mensal
          </h3>
          {stats.comparativoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.comparativoMensal} margin={{ left: 0, right: 10 }}>
                <defs>
                  <linearGradient id="barGradientR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={28} fill="url(#barGradientR)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados para o período</p>
              <button onClick={() => navigate(isMobile ? "/adicionar" : "/notas")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" /> Cadastrar primeira nota
              </button>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-accent" />
            Por Setor
          </h3>
          {stats.sectorPie.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={stats.sectorPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {stats.sectorPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="glass-card-elevated rounded-xl p-3 text-xs border border-border/60">
                          <p className="font-medium text-foreground">{payload[0].name}</p>
                          <p className="text-primary font-bold">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
                {stats.sectorPie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-muted-foreground font-medium">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <PieChartIcon className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Volume + Top Fornecedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Volume de Notas
          </h3>
          {stats.volumeMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.volumeMensal} margin={{ left: 0, right: 10 }}>
                <defs>
                  <linearGradient id="colorVolumeR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="hsl(210, 100%, 60%)" strokeWidth={2.5} fill="url(#colorVolumeR)"
                  dot={{ r: 4, fill: "hsl(210, 100%, 60%)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "hsl(210, 100%, 60%)", stroke: "hsl(220, 22%, 9%)", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados</p>
            </div>
          )}
        </div>

        {/* Top Fornecedores */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            Top Fornecedores
          </h3>
          {stats.topFornecedores.length > 0 ? (
            <div className="space-y-4">
              {stats.topFornecedores.map((f, i) => (
                <div key={f.nome} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground w-5 text-center">{i + 1}º</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{f.nome}</p>
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
                        style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground font-mono">{formatCurrency(f.valor)}</p>
                    <p className="text-[10px] text-muted-foreground">{f.pct.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
