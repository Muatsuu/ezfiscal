import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Calendario = () => {
  const { notas } = useNotas();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const notasByDay: Record<number, typeof notas> = {};
    notas.forEach((n) => {
      const d = new Date(n.dataVencimento + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!notasByDay[day]) notasByDay[day] = [];
        notasByDay[day].push(n);
      }
    });

    return { firstDay, daysInMonth, notasByDay };
  }, [notas, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < calendarData.firstDay; i++) cells.push(null);
  for (let d = 1; d <= calendarData.daysInMonth; d++) cells.push(d);

  const totalVencimentos = Object.values(calendarData.notasByDay).reduce((s, arr) => s + arr.length, 0);
  const totalValor = Object.values(calendarData.notasByDay).reduce(
    (s, arr) => s + arr.reduce((ss, n) => ss + n.valor, 0), 0
  );

  const upcomingNotas = notas
    .filter((n) => {
      const d = new Date(n.dataVencimento + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month && n.status !== "paga";
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 10);

  return (
    <div className="space-y-6 pt-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            Calendário
          </h2>
          <p className="text-xs text-muted-foreground mt-1 ml-[52px]">Vencimentos do mês</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground capitalize min-w-[140px] text-center">
            {monthLabel}
          </span>
          <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-5 text-center bg-gradient-to-br from-primary/5 to-transparent">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vencimentos</p>
          <p className="text-2xl font-bold text-foreground">{totalVencimentos}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center bg-gradient-to-br from-warning/5 to-transparent">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total a Pagar</p>
          <p className="text-lg font-bold text-warning font-mono">{formatCurrency(totalValor)}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-2xl p-4 lg:p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[10px] lg:text-xs font-semibold text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[60px] lg:min-h-[85px]" />;

            const dayNotas = calendarData.notasByDay[day] || [];
            const hasVencidas = dayNotas.some((n) => n.status === "vencida");
            const hasPendentes = dayNotas.some((n) => n.status === "pendente");
            const allPagas = dayNotas.length > 0 && dayNotas.every((n) => n.status === "paga");

            return (
              <div
                key={day}
                className={`min-h-[60px] lg:min-h-[85px] rounded-xl p-1.5 lg:p-2 transition-all duration-200 ${
                  isToday(day)
                    ? "bg-primary/8 border border-primary/30 shadow-sm"
                    : dayNotas.length > 0
                    ? "bg-secondary/40 border border-border/30 hover:border-border/60"
                    : "border border-transparent hover:bg-secondary/20"
                }`}
              >
                <span className={`text-xs lg:text-sm font-semibold ${
                  isToday(day) ? "text-primary" : "text-foreground"
                }`}>
                  {day}
                </span>

                {dayNotas.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayNotas.slice(0, 2).map((n) => (
                      <div
                        key={n.id}
                        className={`text-[8px] lg:text-[10px] truncate px-1 py-0.5 rounded font-medium ${
                          n.status === "paga"
                            ? "bg-success/10 text-success"
                            : n.status === "vencida"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {n.fornecedor}
                      </div>
                    ))}
                    {dayNotas.length > 2 && (
                      <p className="text-[8px] text-muted-foreground text-center font-medium">
                        +{dayNotas.length - 2}
                      </p>
                    )}
                  </div>
                )}

                {dayNotas.length > 0 && (
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {hasVencidas && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                    {hasPendentes && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
                    {allPagas && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Próximos Vencimentos
          </h3>
          <button
            onClick={() => navigate("/notas")}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 group"
          >
            Ver notas <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="space-y-1">
          {upcomingNotas.map((n, i) => (
            <div
              key={n.id}
              className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{n.fornecedor}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(n.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")} · {n.setor}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-foreground font-mono">{formatCurrency(n.valor)}</p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    n.status === "vencida" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                  }`}
                >
                  {n.status === "vencida" ? "Vencida" : "Pendente"}
                </span>
              </div>
            </div>
          ))}
          {upcomingNotas.length === 0 && (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum vencimento pendente neste mês</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendario;
