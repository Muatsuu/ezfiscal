import { useNotas } from "@/contexts/NFContext";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, FileText, AlertTriangle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

    // Gastos por setor
    const porSetor = notas.reduce((acc, n) => {
      acc[n.setor] = (acc[n.setor] || 0) + n.valor;
      return acc;
    }, {} as Record<string, number>);

    const setoresOrdenados = Object.entries(porSetor)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { total, pendentes, vencidas, pagas, aVencer, setoresOrdenados };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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

      {/* Gastos por Setor */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Gastos por Setor
        </h2>
        <div className="space-y-3">
          {stats.setoresOrdenados.map(([setor, valor]) => {
            const maxVal = stats.setoresOrdenados[0]?.[1] || 1;
            const pct = ((valor as number) / (maxVal as number)) * 100;
            return (
              <div key={setor} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{setor}</span>
                  <span className="text-muted-foreground">{formatCurrency(valor as number)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
