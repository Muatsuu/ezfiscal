import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { FileText, DollarSign, Clock, CheckCircle, Zap, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AddNotaModal from "@/components/AddNotaModal";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import InsightsSection from "@/components/dashboard/InsightsSection";

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

const Dashboard = () => {
  const { notas } = useNotas();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddNota = () => {
    if (isMobile) {
      navigate("/adicionar");
    } else {
      setShowAddModal(true);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stats = useMemo(() => {
    const total = notas.reduce((sum, n) => sum + n.valor, 0);
    const pendentes = notas.filter((n) => n.status === "pendente");
    const pagas = notas.filter((n) => n.status === "paga");
    const vencidas = notas.filter((n) => n.status === "vencida");
    const totalPago = pagas.reduce((sum, n) => sum + n.valor, 0);
    const totalPendente = pendentes.reduce((sum, n) => sum + n.valor, 0) + vencidas.reduce((sum, n) => sum + n.valor, 0);

    const porSetorMap = notas.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const porSetorData = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ setor, valor, color: SECTOR_COLORS[setor] || "hsl(210, 100%, 60%)" }));

    const porMesMap = notas.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const evolucaoMensal = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => {
        const [y, m] = mes.split("-");
        const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        return { mes: monthNames[parseInt(m) - 1], valor };
      });

    const sectorPie = porSetorData.map((d) => ({
      name: d.setor,
      value: d.valor,
      color: d.color,
    }));

    return { total, totalPago, totalPendente, porSetorData, evolucaoMensal, sectorPie, count: notas.length };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatCompact = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-2xl text-xs">
          <p className="font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-primary font-bold text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pt-2 overflow-x-hidden">
      {/* Header */}
      <div>
        <p className="text-[11px] text-muted-foreground capitalize tracking-wide">{dateStr}</p>
        <h2 className="text-2xl font-bold text-foreground mt-1">Dashboard</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { icon: FileText, label: "Total de NFs", value: String(stats.count), colorClass: "text-primary", bgClass: "bg-primary/8" },
          { icon: DollarSign, label: "Total Geral", value: formatCurrency(stats.total), colorClass: "text-accent", bgClass: "bg-accent/8" },
          { icon: Clock, label: "A Pagar", value: formatCurrency(stats.totalPendente), colorClass: "text-warning", bgClass: "bg-warning/8" },
          { icon: CheckCircle, label: "Pago", value: formatCurrency(stats.totalPago), colorClass: "text-success", bgClass: "bg-success/8" },
        ].map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-5 lg:p-6 group hover:border-border/60 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.colorClass}`} />
              </div>
              <span className="text-[10px] lg:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className={`text-xl lg:text-2xl font-bold ${card.label === "Total de NFs" ? "text-foreground" : card.colorClass}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Tendência de Gastos
          </h3>
          {stats.evolucaoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.evolucaoMensal} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "hsl(215, 12%, 45%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(215, 12%, 45%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompact}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(210, 100%, 60%)"
                  strokeWidth={2.5}
                  fill="url(#colorValor)"
                  dot={{ r: 4, fill: "hsl(210, 100%, 60%)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "hsl(210, 100%, 60%)", stroke: "hsl(220, 22%, 9%)", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              <button onClick={handleAddNota} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" /> Cadastrar primeira nota
              </button>
            </div>
          )}
        </div>

        {/* Sector Pie */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-5">Distribuição por Setor</h3>
          {stats.sectorPie.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={stats.sectorPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
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
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
                {stats.sectorPie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sem dados</p>
            </div>
          )}
        </div>
      </div>

      {/* Gastos por Setor */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-5">Gastos por Setor</h3>
        {stats.porSetorData.length > 0 ? (
          <div className="space-y-4">
            {stats.porSetorData.map((item) => {
              const pct = stats.total > 0 ? (item.valor / stats.total) * 100 : 0;
              return (
                <div key={item.setor} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs lg:text-sm text-foreground min-w-[90px] lg:min-w-[130px] truncate">{item.setor}</span>
                  <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden min-w-[40px]">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                      }}
                    />
                  </div>
                  <span className="text-xs lg:text-sm font-semibold text-foreground min-w-[80px] lg:min-w-[110px] text-right">{formatCurrency(item.valor)}</span>
                  <span className="text-[11px] text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
        )}
      </div>

      {/* Insights */}
      <InsightsSection notas={notas} />

      {/* Notas Recentes */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Notas Recentes</h3>
          <button
            onClick={() => navigate("/notas")}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todas →
          </button>
        </div>
        <div className="space-y-1">
          {notas.slice(0, 5).map((nota) => (
            <div
              key={nota.id}
              className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{nota.fornecedor}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {nota.numero} · {nota.setor}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-foreground">{formatCurrency(nota.valor)}</p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${
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
            </div>
          ))}
          {notas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma nota cadastrada</p>
              <button onClick={handleAddNota} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" /> Cadastrar primeira nota
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddNotaModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default Dashboard;
