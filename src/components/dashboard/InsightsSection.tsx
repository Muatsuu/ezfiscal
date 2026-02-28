import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { NotaFiscal } from "@/types/notaFiscal";

interface InsightsSectionProps {
  notas: NotaFiscal[];
}

const SECTOR_COLORS: Record<string, string> = {
  "Administrativo": "hsl(207, 90%, 54%)",
  "Manutenção": "hsl(36, 100%, 50%)",
  "Cozinha": "hsl(152, 60%, 42%)",
  "GOV.": "hsl(280, 60%, 55%)",
  "A&B": "hsl(0, 72%, 55%)",
  "Serviços Gerais": "hsl(200, 70%, 50%)",
  "Não Identificado": "hsl(215, 12%, 48%)",
};

const InsightsSection = ({ notas }: InsightsSectionProps) => {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month notas
    const thisMonth = notas.filter((n) => {
      const d = new Date(n.dataEmissao);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Last month notas
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = notas.filter((n) => {
      const d = new Date(n.dataEmissao);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((s, n) => s + n.valor, 0);
    const lastMonthTotal = lastMonth.reduce((s, n) => s + n.valor, 0);

    // Overall change
    const overallChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Sector comparisons
    const sectorThisMonth: Record<string, number> = {};
    const sectorLastMonth: Record<string, number> = {};

    thisMonth.forEach((n) => {
      sectorThisMonth[n.setor] = (sectorThisMonth[n.setor] || 0) + n.valor;
    });
    lastMonth.forEach((n) => {
      sectorLastMonth[n.setor] = (sectorLastMonth[n.setor] || 0) + n.valor;
    });

    const allSectors = [...new Set([...Object.keys(sectorThisMonth), ...Object.keys(sectorLastMonth)])];
    const sectorComparisons = allSectors
      .map((setor) => {
        const current = sectorThisMonth[setor] || 0;
        const previous = sectorLastMonth[setor] || 0;
        const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
        return { setor, current, previous, change };
      })
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);

    // Projection: if we have data, project based on daily average
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyAvg = dayOfMonth > 0 ? thisMonthTotal / dayOfMonth : 0;
    const projectedTotal = dailyAvg * daysInMonth;

    return { thisMonthTotal, lastMonthTotal, overallChange, sectorComparisons, projectedTotal, dayOfMonth, daysInMonth };
  }, [notas]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Projection Card */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Projeção do Mês
        </h3>
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Gasto atual (dia {insights.dayOfMonth}/{insights.daysInMonth})</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(insights.thisMonthTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase">Projeção fim do mês</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(insights.projectedTotal)}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min((insights.dayOfMonth / insights.daysInMonth) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Base: média diária de {formatCurrency(insights.thisMonthTotal / Math.max(insights.dayOfMonth, 1))}
          </p>
        </div>
      </div>

      {/* Sector Comparison Card */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          {insights.overallChange <= 0 ? (
            <TrendingDown className="w-4 h-4 text-success" />
          ) : (
            <TrendingUp className="w-4 h-4 text-destructive" />
          )}
          Comparativo vs Mês Anterior
        </h3>

        {/* Overall */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <span className="text-sm font-semibold text-foreground">Total Geral</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{formatCurrency(insights.thisMonthTotal)}</span>
            {insights.lastMonthTotal > 0 && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  insights.overallChange > 0
                    ? "bg-destructive/10 text-destructive"
                    : insights.overallChange < 0
                    ? "bg-success/10 text-success"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {insights.overallChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : insights.overallChange < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {Math.abs(insights.overallChange).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Per sector */}
        <div className="space-y-2.5">
          {insights.sectorComparisons.map((s) => (
            <div key={s.setor} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SECTOR_COLORS[s.setor] || "hsl(207, 90%, 54%)" }}
                />
                <span className="text-xs text-foreground truncate">{s.setor}</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs font-semibold text-foreground">{formatCurrency(s.current)}</span>
                {s.previous > 0 && (
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                      s.change > 0 ? "text-destructive" : s.change < 0 ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {s.change > 0 ? "↑" : s.change < 0 ? "↓" : "="}
                    {Math.abs(s.change).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
          {insights.sectorComparisons.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Sem dados para comparar</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;
