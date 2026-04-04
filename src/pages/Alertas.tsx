import { useNotas } from "@/contexts/NFContext";
import { useMemo, useState } from "react";
import { Bell, BellRing, AlertTriangle, CheckCircle, Clock, ArrowRight, Shield, Filter, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AlertFilter = "all" | "vencidas" | "hoje" | "proximas";

const Alertas = () => {
  const { notas, updateNota } = useNotas();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertFilter>("all");

  const { aVencer, vencidas, venceHoje } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDays = new Date(today);
    threeDays.setDate(today.getDate() + 3);

    const pendentes = notas.filter((n) => n.status === "pendente");
    const aVencer = pendentes.filter((n) => {
      const v = new Date(n.dataVencimento);
      return v > today && v <= threeDays;
    });
    const venceHoje = pendentes.filter((n) => {
      const v = new Date(n.dataVencimento);
      v.setHours(0, 0, 0, 0);
      return v.getTime() === today.getTime();
    });
    const vencidas = notas.filter((n) => n.status === "vencida");

    return { aVencer, vencidas, venceHoje };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const diasParaVencer = (dataVencimento: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento);
    return Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handlePay = async (notaId: string) => {
    await updateNota(notaId, { status: "paga" });
    toast.success("Nota marcada como paga!");
  };

  const totalVencidas = vencidas.reduce((s, n) => s + n.valor, 0);
  const totalAVencer = aVencer.reduce((s, n) => s + n.valor, 0);
  const totalHoje = venceHoje.reduce((s, n) => s + n.valor, 0);
  const totalAll = totalVencidas + totalAVencer + totalHoje;

  const filteredItems = useMemo(() => {
    if (filter === "vencidas") return { vencidas, aVencer: [], venceHoje: [] };
    if (filter === "hoje") return { vencidas: [], aVencer: [], venceHoje };
    if (filter === "proximas") return { vencidas: [], aVencer, venceHoje: [] };
    return { vencidas, aVencer, venceHoje };
  }, [filter, vencidas, aVencer, venceHoje]);

  const filters: { value: AlertFilter; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: vencidas.length + aVencer.length + venceHoje.length },
    { value: "vencidas", label: "Vencidas", count: vencidas.length },
    { value: "hoje", label: "Hoje", count: venceHoje.length },
    { value: "proximas", label: "Próximas", count: aVencer.length },
  ];

  return (
    <div className="space-y-6 pt-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-warning" />
            </div>
            Alertas
          </h2>
          <p className="text-xs text-muted-foreground mt-1 ml-[52px]">
            {vencidas.length + aVencer.length + venceHoje.length} alerta{vencidas.length + aVencer.length + venceHoje.length !== 1 ? "s" : ""} ativo{vencidas.length + aVencer.length + venceHoje.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {(aVencer.length > 0 || vencidas.length > 0 || venceHoje.length > 0) && (
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 bg-gradient-to-br from-destructive/5 to-transparent">
            <div className="flex items-center gap-1 lg:gap-2 mb-1.5 lg:mb-2">
              <AlertTriangle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-destructive flex-shrink-0" />
              <span className="text-[8px] lg:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Vencidas</span>
            </div>
            <p className="text-lg lg:text-xl font-bold text-destructive">{vencidas.length}</p>
            <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 lg:mt-1 font-mono truncate">{formatCurrency(totalVencidas)}</p>
          </div>
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 bg-gradient-to-br from-warning/5 to-transparent">
            <div className="flex items-center gap-1 lg:gap-2 mb-1.5 lg:mb-2">
              <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-warning flex-shrink-0" />
              <span className="text-[8px] lg:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Hoje</span>
            </div>
            <p className="text-lg lg:text-xl font-bold text-warning">{venceHoje.length}</p>
            <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 lg:mt-1 font-mono truncate">{formatCurrency(totalHoje)}</p>
          </div>
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-1 lg:gap-2 mb-1.5 lg:mb-2">
              <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary flex-shrink-0" />
              <span className="text-[8px] lg:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Em breve</span>
            </div>
            <p className="text-lg lg:text-xl font-bold text-primary">{aVencer.length}</p>
            <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 lg:mt-1 font-mono truncate">{formatCurrency(totalAVencer)}</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === f.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                filter === f.value ? "bg-primary-foreground/20" : "bg-muted"
              }`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {filteredItems.vencidas.length === 0 && filteredItems.aVencer.length === 0 && filteredItems.venceHoje.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success/60" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {filter === "all" ? "Tudo em dia!" : "Nenhum alerta nesta categoria"}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {filter === "all"
              ? "Nenhuma nota a vencer nos próximos 3 dias. Continue assim!"
              : "Tente selecionar outro filtro."}
          </p>
          <button
            onClick={() => navigate("/notas")}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
          >
            Ver todas as notas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Vence hoje */}
          {filteredItems.venceHoje.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Zap className="w-3.5 h-3.5" />
                Vence hoje ({filteredItems.venceHoje.length})
              </p>
              {filteredItems.venceHoje.map((nota, i) => (
                <div key={nota.id}
                  className="glass-card rounded-2xl p-5 border-l-4 border-l-warning hover-lift animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{nota.numero} · {nota.setor}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning mt-2">
                        <Zap className="w-3 h-3" /> Vence hoje!
                      </span>
                    </div>
                    <div className="text-right ml-3 flex flex-col items-end gap-2">
                      <p className="text-base font-bold text-foreground font-mono">{formatCurrency(nota.valor)}</p>
                      <button onClick={() => handlePay(nota.id)}
                        className="text-[11px] px-3.5 py-1.5 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors">
                        Marcar paga
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* A vencer */}
          {filteredItems.aVencer.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Clock className="w-3.5 h-3.5" />
                Vencendo em breve ({filteredItems.aVencer.length})
              </p>
              {filteredItems.aVencer.map((nota, i) => {
                const dias = diasParaVencer(nota.dataVencimento);
                return (
                  <div key={nota.id}
                    className="glass-card rounded-2xl p-5 border-l-4 border-l-primary hover-lift animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{nota.numero} · {nota.setor}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mt-2">
                          <Clock className="w-3 h-3" />
                          {dias === 1 ? "Vence amanhã" : `Vence em ${dias} dias`}
                        </span>
                      </div>
                      <div className="text-right ml-3 flex flex-col items-end gap-2">
                        <p className="text-base font-bold text-foreground font-mono">{formatCurrency(nota.valor)}</p>
                        <button onClick={() => handlePay(nota.id)}
                          className="text-[11px] px-3.5 py-1.5 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors">
                          Marcar paga
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vencidas */}
          {filteredItems.vencidas.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5 px-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vencidas ({filteredItems.vencidas.length})
              </p>
              {filteredItems.vencidas.map((nota, i) => (
                <div key={nota.id}
                  className="glass-card rounded-2xl p-5 border-l-4 border-l-destructive hover-lift animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{nota.numero} · {nota.setor}</p>
                      <p className="text-xs mt-2 text-destructive font-semibold">
                        Venceu em {new Date(nota.dataVencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex flex-col items-end gap-2">
                      <p className="text-base font-bold text-foreground font-mono">{formatCurrency(nota.valor)}</p>
                      <button onClick={() => handlePay(nota.id)}
                        className="text-[11px] px-3.5 py-1.5 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors">
                        Marcar paga
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Total value bar */}
      {totalAll > 0 && (
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exposição total</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{formatCurrency(totalAll)}</span>
        </div>
      )}
    </div>
  );
};

export default Alertas;
