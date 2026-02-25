import { useNotas } from "@/contexts/NFContext";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, FileText, AlertTriangle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
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

const Dashboard = () => {
  const { notas } = useNotas();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = notas.reduce((sum, n) => sum + n.valor, 0);
    const pendentes = notas.filter((n) => n.status === "pendente");
    const vencidas = notas.filter((n) => n.status === "vencida");
    const pagas = notas.filter((n) => n.status === "paga");

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const aVencer = pendentes.filter((n) => {
      const venc = new Date(n.dataVencimento);
      return venc <= threeDaysFromNow && venc >= today;
    });

    // Gastos por setor (bar chart data)
    const porSetorMap = notas.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);

    const porSetorData = Object.entries(porSetorMap)
      .sort(([, a], [, b]) => b - a)
      .map(([setor, valor]) => ({ setor, valor }));

    // Evolução mensal (line chart data)
    const porMesMap = notas.reduce((acc, n) => {
      const mes = n.dataEmissao.slice(0, 7); // YYYY-MM
      acc[mes] = (acc[mes] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);

    const evolucaoMensal = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({
        mes: mes.split("-").reverse().join("/"), // MM/YYYY
        valor,
      }));

    // Status distribution (pie chart)
    const statusData = [
      { name: "Pendentes", value: pendentes.length, color: "hsl(38, 92%, 50%)" },
      { name: "Pagas", value: pagas.length, color: "hsl(152, 60%, 42%)" },
      { name: "Vencidas", value: vencidas.length, color: "hsl(0, 72%, 55%)" },
    ].filter((d) => d.value > 0);

    return { total, pendentes, vencidas, pagas, aVencer, porSetorData, evolucaoMensal, statusData };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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

  return (
    <div className="space-y-5">
      {/* Total Card */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total em NFs</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(stats.total)}</p>
            <p className="text-xs opacity-70 mt-2">{notas.length} notas cadastradas</p>
          </div>
          <DollarSign className="w-10 h-10 opacity-30" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate("/notas")}
          className="glass-card rounded-xl p-3 text-center transition-transform active:scale-95"
        >
          <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-full bg-primary/10 mb-2">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.pendentes.length}</p>
          <p className="text-[10px] text-muted-foreground">Pendentes</p>
        </button>

        <button
          onClick={() => navigate("/alertas")}
          className="glass-card rounded-xl p-3 text-center transition-transform active:scale-95"
        >
          <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-full bg-warning/10 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.aVencer.length}</p>
          <p className="text-[10px] text-muted-foreground">A vencer</p>
        </button>

        <div className="glass-card rounded-xl p-3 text-center">
          <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-full bg-destructive/10 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.vencidas.length}</p>
          <p className="text-[10px] text-muted-foreground">Vencidas</p>
        </div>
      </div>

      {/* Gastos por Setor - Bar Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Gastos por Setor
        </h2>
        {stats.porSetorData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
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
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={18}>
                {stats.porSetorData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
        )}
      </div>

      {/* Evolução Mensal - Line Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">📈 Evolução Mensal</h2>
        {stats.evolucaoMensal.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.evolucaoMensal} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: "hsl(215, 10%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="hsl(215, 80%, 48%)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(215, 80%, 48%)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">
            {stats.evolucaoMensal.length === 1 ? "Precisa de mais de 1 mês para exibir" : "Sem dados"}
          </p>
        )}
      </div>

      {/* Status - Pie Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">📊 Notas por Status</h2>
        {stats.statusData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {stats.statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-foreground">{d.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
        )}
      </div>

      {/* Últimas NFs */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Últimas NFs</h2>
          <button
            onClick={() => navigate("/notas")}
            className="text-xs text-primary font-medium"
          >
            Ver todas
          </button>
        </div>
        <div className="space-y-3">
          {notas.slice(0, 3).map((nota) => (
            <div
              key={nota.id}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{nota.fornecedor}</p>
                <p className="text-xs text-muted-foreground">
                  {nota.numero} · {nota.setor}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(nota.valor)}
                </p>
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
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma nota cadastrada</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
