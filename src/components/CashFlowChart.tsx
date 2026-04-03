import { useMemo } from "react";
import { NotaFiscal } from "@/types/notaFiscal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Landmark } from "lucide-react";

interface CashFlowChartProps {
  notas: NotaFiscal[];
}

const CashFlowChart = ({ notas }: CashFlowChartProps) => {
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weeks: { label: string; start: Date; end: Date }[] = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(today);
      start.setDate(today.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const label = `${start.getDate()}/${start.getMonth() + 1}`;
      weeks.push({ label, start, end });
    }

    return weeks.map(({ label, start, end }) => {
      const pending = notas.filter((n) => {
        if (n.status === "paga") return false;
        const d = new Date(n.dataVencimento);
        return d >= start && d <= end;
      });
      const valor = pending.reduce((sum, n) => sum + n.valor, 0);
      const overdue = start < today;
      return { semana: label, valor, overdue };
    });
  }, [notas]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  const totalProjected = data.reduce((s, d) => s + d.valor, 0);

  if (totalProjected === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Landmark className="w-4 h-4 text-accent" />
          Fluxo de Caixa — Próximas 12 Semanas
        </h3>
        <span className="text-xs font-mono font-bold text-warning bg-warning/10 px-3 py-1 rounded-full">
          {formatCurrency(totalProjected)} previsto
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 0, right: 10 }}>
          <defs>
            <linearGradient id="cfGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160, 60%, 42%)" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(160, 60%, 42%)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="cfRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" vertical={false} />
          <XAxis dataKey="semana" tick={{ fontSize: 10, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 45%)" }} axisLine={false} tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
          <Tooltip content={({ active, payload, label }) => {
            if (active && payload?.length) {
              return (
                <div className="glass-card-elevated rounded-xl p-3 text-xs border border-border/60">
                  <p className="text-muted-foreground mb-1">Semana de {label}</p>
                  <p className="text-primary font-bold text-sm">{formatCurrency(payload[0].value as number)}</p>
                </div>
              );
            }
            return null;
          }} />
          <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={24}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.overdue ? "url(#cfRed)" : "url(#cfGreen)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
