import { useNotas } from "@/contexts/NFContext";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import {
  FileText, DollarSign, Clock, CheckCircle, Zap, PlusCircle,
  TrendingUp, TrendingDown, ArrowRight, Building2, CalendarDays,
  BarChart3, BellRing, ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AddNotaModal from "@/components/AddNotaModal";
import { DashboardSkeleton } from "@/components/NotasSkeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import InsightsSection from "@/components/dashboard/InsightsSection";
import CashFlowChart from "@/components/CashFlowChart";

const SECTOR_COLORS: Record<string, string> = {
  "Administrativo": "hsl(215, 100%, 58%)",
  "Manutenção": "hsl(38, 92%, 56%)",
  "Cozinha": "hsl(160, 60%, 42%)",
  "GOV.": "hsl(270, 60%, 60%)",
  "A&B": "hsl(0, 72%, 55%)",
  "Operações": "hsl(200, 65%, 55%)",
  "Serviços Gerais": "hsl(190, 60%, 50%)",
  "Não Identificado": "hsl(215, 14%, 45%)",
};

const Dashboard = () => {
  const { notas, loading } = useNotas();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddNota = () => {
    if (isMobile) navigate("/adicionar");
    else setShowAddModal(true);
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const userName = user?.email?.split("@")[0] || "Usuário";

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const stats = useMemo(() => {
    const total = notas.reduce((sum, n) => sum + n.valor, 0);
    const pendentes = notas.filter((n) => n.status === "pendente");
    const pagas = notas.filter((n) => n.status === "paga");
    const vencidas = notas.filter((n) => n.status === "vencida");
    const totalPago = pagas.reduce((sum, n) => sum + n.valor, 0);
    const totalPendente = pendentes.reduce((sum, n) => sum + n.valor, 0) + vencidas.reduce((sum, n) => sum + n.valor, 0);

    // Month comparison
    const now = new Date();
    const thisMonthNotas = notas.filter(n => {
      const d = new Date(n.dataEmissao);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthNotas = notas.filter(n => {
      const d = new Date(n.dataEmissao);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    const thisMonthTotal = thisMonthNotas.reduce((s, n) => s + n.valor, 0);
    const lastMonthTotal = lastMonthNotas.reduce((s, n) => s + n.valor, 0);
    const changePercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    const porSetorMap = notas.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const porSetorData = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ setor, valor, color: SECTOR_COLORS[setor] || "hsl(215, 100%, 58%)" }));

    const porMesMap = notas.reduce((acc, n) => {
      const d = new Date(n.dataEmissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const evolucaoMensal = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes]) => {
        const [, m] = mes.split("-");
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return { mes: monthNames[parseInt(m) - 1], valor: porMesMap[mes] };
      });

    const sectorPie = porSetorData.map((d) => ({
      name: d.setor, value: d.valor, color: d.color,
    }));

    return {
      total, totalPago, totalPendente, porSetorData, evolucaoMensal, sectorPie,
      count: notas.length, vencidasCount: vencidas.length, changePercent,
    };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card-elevated rounded-xl p-3 text-xs border border-border/60">
          <p className="font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-primary font-bold text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <DashboardSkeleton />;

  const kpiCards = [
    {
      icon: FileText, label: "Total de NFs", value: String(stats.count),
      colorClass: "text-primary", bgClass: "bg-primary/8",
      gradient: "from-primary/10 to-primary-glow/5",
    },
    {
      icon: DollarSign, label: "Total Geral", value: formatCurrency(stats.total),
      colorClass: "text-accent", bgClass: "bg-accent/8",
      gradient: "from-accent/10 to-accent/5",
    },
    {
      icon: Clock, label: "A Pagar", value: formatCurrency(stats.totalPendente),
      colorClass: "text-warning", bgClass: "bg-warning/8",
      gradient: "from-warning/10 to-warning/5",
      badge: stats.vencidasCount > 0 ? `${stats.vencidasCount} vencida${stats.vencidasCount > 1 ? "s" : ""}` : undefined,
    },
    {
      icon: CheckCircle, label: "Pago", value: formatCurrency(stats.totalPago),
      colorClass: "text-success", bgClass: "bg-success/8",
      gradient: "from-success/10 to-success/5",
    },
  ];

  const quickLinks = [
    { label: "Nova NF", icon: PlusCircle, action: handleAddNota, color: "text-primary bg-primary/8" },
    { label: "Fornecedores", icon: Building2, action: () => navigate("/fornecedores"), color: "text-accent bg-accent/8" },
    { label: "Calendário", icon: CalendarDays, action: () => navigate("/calendario"), color: "text-success bg-success/8" },
    { label: "Relatórios", icon: BarChart3, action: () => navigate("/relatorios"), color: "text-warning bg-warning/8" },
    { label: "Alertas", icon: BellRing, action: () => navigate("/alertas"), color: "text-destructive bg-destructive/8" },
  ];

  return (
    <div className="space-y-5 pt-2 overflow-x-hidden w-full max-w-full">
      {/* Header with greeting */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground capitalize tracking-wide">{dateStr}</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mt-1">
            {greeting}, <span className="gradient-text">{userName}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 self-start">
          {stats.changePercent !== 0 && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              stats.changePercent > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            }`}>
              {stats.changePercent > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(stats.changePercent).toFixed(0)}% vs mês anterior
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={link.action}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium whitespace-nowrap transition-all hover-scale group"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${link.color}`}>
              <link.icon className="w-3.5 h-3.5" />
            </div>
            {link.label}
            <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`glass-card rounded-2xl p-4 lg:p-6 group hover-lift gradient-border bg-gradient-to-br ${card.gradient} min-w-0`}
          >
            <div className="flex items-center gap-1.5 mb-2 lg:mb-3">
              <div className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl ${card.bgClass} flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${card.colorClass}`} />
              </div>
              <span className="text-[9px] lg:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{card.label}</span>
            </div>
            <p className={`text-base lg:text-2xl font-bold tracking-tight truncate ${card.label === "Total de NFs" ? "text-foreground" : card.colorClass}`}>
              {card.value}
            </p>
            {card.badge && (
              <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                {card.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-x-hidden">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 lg:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Tendência de Gastos
          </h3>
          {stats.evolucaoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.evolucaoMensal} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(215, 100%, 58%)" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="hsl(215, 100%, 58%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(215, 100%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 12%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(215, 14%, 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="valor"
                  stroke="hsl(215, 100%, 58%)" strokeWidth={2.5}
                  fill="url(#colorValor)"
                  dot={{ r: 4, fill: "hsl(215, 100%, 58%)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "hsl(215, 100%, 58%)", stroke: "hsl(225, 25%, 4%)", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Zap className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Sem dados suficientes</p>
              <button onClick={handleAddNota} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" /> Cadastrar primeira nota
              </button>
            </div>
          )}
        </div>

        {/* Sector Pie */}
        <div className="glass-card rounded-2xl p-4 lg:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-5">Distribuição por Setor</h3>
          {stats.sectorPie.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.sectorPie} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={88} paddingAngle={3}
                    dataKey="value" stroke="none"
                  >
                    {stats.sectorPie.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="glass-card-elevated rounded-xl p-3 text-xs border border-border/60">
                            <p className="font-medium text-foreground">{payload[0].name}</p>
                            <p className="text-primary font-bold">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
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
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-muted-foreground/30" />
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
                <div key={item.setor} className="flex items-center gap-3 group">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-card" style={{ backgroundColor: item.color }} />
                  <span className="text-xs lg:text-sm text-foreground min-w-[90px] lg:min-w-[130px] truncate font-medium">{item.setor}</span>
                  <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden min-w-[40px]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                      }}
                    />
                  </div>
                  <span className="text-xs lg:text-sm font-bold text-foreground min-w-[80px] lg:min-w-[110px] text-right font-mono">{formatCurrency(item.valor)}</span>
                  <span className="text-[11px] text-muted-foreground w-10 text-right font-mono">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
        )}
      </div>

      {/* Cash Flow Projection */}
      <CashFlowChart notas={notas} />

      {/* Insights */}
      <InsightsSection notas={notas} />

      {/* Notas Recentes */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Notas Recentes</h3>
          <button
            onClick={() => navigate("/notas")}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 group"
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="space-y-1">
          {notas.slice(0, 5).map((nota, i) => (
            <div
              key={nota.id}
              className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-3 px-3 rounded-xl transition-all duration-200 cursor-pointer group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  nota.status === "paga" ? "bg-success/10" : nota.status === "vencida" ? "bg-destructive/10" : "bg-warning/10"
                }`}>
                  <FileText className={`w-4 h-4 ${
                    nota.status === "paga" ? "text-success" : nota.status === "vencida" ? "text-destructive" : "text-warning"
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{nota.fornecedor}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {nota.numero} · {nota.setor}
                  </p>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-foreground font-mono">{formatCurrency(nota.valor)}</p>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
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
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Nenhuma nota cadastrada</p>
                <p className="text-xs text-muted-foreground mt-1">Comece adicionando sua primeira nota fiscal</p>
              </div>
              <button onClick={handleAddNota} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
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
