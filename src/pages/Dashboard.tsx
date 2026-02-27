import { useNotas } from "@/contexts/NFContext";
import { useMemo } from "react";
import { FileText, DollarSign, Clock, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const SECTOR_COLORS: Record<string, string> = {
  "Administrativo": "hsl(207, 90%, 54%)",
  "Manutenção": "hsl(36, 100%, 50%)",
  "Cozinha": "hsl(152, 60%, 42%)",
  "GOV.": "hsl(280, 60%, 55%)",
  "A&B": "hsl(0, 72%, 55%)",
  "Serviços Gerais": "hsl(200, 70%, 50%)",
  "Não Identificado": "hsl(215, 12%, 48%)",
};

const Dashboard = () => {
  const { notas } = useNotas();
  const navigate = useNavigate();

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

    // Gastos por setor
    const porSetorMap = notas.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);
    const porSetorData = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ setor, valor, color: SECTOR_COLORS[setor] || "hsl(207, 90%, 54%)" }));

    // Evolução mensal (area chart)
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

    // Sector pie data
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
        <div className="bg-card border border-border rounded-lg p-2.5 shadow-xl text-xs">
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
        <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        <h2 className="text-2xl font-bold text-foreground mt-0.5">Dashboard</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="glass-card rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de NFs</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats.count}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Geral</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">A Pagar</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-warning">{formatCurrency(stats.totalPendente)}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <span className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-success">{formatCurrency(stats.totalPago)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Tendência de Gastos
          </h3>
          {stats.evolucaoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.evolucaoMensal} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 18%)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "hsl(215, 12%, 48%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompact}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(207, 90%, 54%)"
                  strokeWidth={2.5}
                  fill="url(#colorValor)"
                  dot={{ r: 3, fill: "hsl(207, 90%, 54%)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(207, 90%, 54%)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-16">Sem dados suficientes</p>
          )}
        </div>

        {/* Sector Pie */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por Setor</h3>
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

      {/* Gastos por Setor - Progress bars */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Gastos por Setor</h3>
        {stats.porSetorData.length > 0 ? (
          <div className="space-y-3">
            {stats.porSetorData.map((item) => {
              const pct = stats.total > 0 ? (item.valor / stats.total) * 100 : 0;
              return (
                <div key={item.setor} className="flex items-center gap-2 lg:gap-3">
                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs lg:text-sm text-foreground min-w-[80px] lg:min-w-[120px] truncate">{item.setor}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-[40px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs lg:text-sm font-semibold text-foreground min-w-[70px] lg:min-w-[100px] text-right">{formatCurrency(item.valor)}</span>
                  <span className="text-[10px] lg:text-xs text-muted-foreground w-8 lg:w-12 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
        )}
      </div>

      {/* Notas Recentes */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Notas Recentes</h3>
          <button
            onClick={() => navigate("/notas")}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todas →
          </button>
        </div>
        <div className="space-y-3">
          {notas.slice(0, 5).map((nota) => (
            <div
              key={nota.id}
              className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{nota.fornecedor}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nota.numero} · {nota.setor}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(nota.valor)}</p>
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
            </div>
          ))}
          {notas.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma nota cadastrada</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
