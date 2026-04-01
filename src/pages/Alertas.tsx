import { useNotas } from "@/contexts/NFContext";
import { useMemo } from "react";
import { Bell, BellRing, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Alertas = () => {
  const { notas, updateNota } = useNotas();
  const navigate = useNavigate();

  const { aVencer, vencidas } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDays = new Date(today);
    threeDays.setDate(today.getDate() + 3);

    const pendentes = notas.filter((n) => n.status === "pendente");
    const aVencer = pendentes.filter((n) => {
      const v = new Date(n.dataVencimento);
      return v >= today && v <= threeDays;
    });
    const vencidas = notas.filter((n) => n.status === "vencida");

    return { aVencer, vencidas };
  }, [notas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const diasParaVencer = (dataVencimento: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento);
    return Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalVencidas = vencidas.reduce((s, n) => s + n.valor, 0);
  const totalAVencer = aVencer.reduce((s, n) => s + n.valor, 0);

  return (
    <div className="space-y-6 pt-2 overflow-x-hidden">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-warning" />
          </div>
          Alertas
        </h2>
        <p className="text-xs text-muted-foreground mt-1 ml-[52px]">
          {aVencer.length + vencidas.length} alerta{aVencer.length + vencidas.length !== 1 ? "s" : ""} ativo{aVencer.length + vencidas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary cards */}
      {(aVencer.length > 0 || vencidas.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-warning/5 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">A vencer</span>
            </div>
            <p className="text-xl font-bold text-warning">{aVencer.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{formatCurrency(totalAVencer)}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-destructive/5 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vencidas</span>
            </div>
            <p className="text-xl font-bold text-destructive">{vencidas.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{formatCurrency(totalVencidas)}</p>
          </div>
        </div>
      )}

      {aVencer.length === 0 && vencidas.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success/60" />
          </div>
          <p className="text-lg font-semibold text-foreground">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Nenhuma nota a vencer nos próximos 3 dias. Continue assim!
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
          {/* A vencer */}
          {aVencer.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Clock className="w-3.5 h-3.5" />
                Vencendo em breve ({aVencer.length})
              </p>
              {aVencer.map((nota, i) => {
                const dias = diasParaVencer(nota.dataVencimento);
                return (
                  <div
                    key={nota.id}
                    className="glass-card rounded-2xl p-5 border-l-4 border-l-warning hover-lift animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{nota.numero} · {nota.setor}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            dias === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                          }`}>
                            <Clock className="w-3 h-3" />
                            {dias === 0 ? "Vence hoje!" : dias === 1 ? "Vence amanhã" : `Vence em ${dias} dias`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex flex-col items-end gap-2">
                        <p className="text-base font-bold text-foreground font-mono">{formatCurrency(nota.valor)}</p>
                        <button
                          onClick={() => updateNota(nota.id, { status: "paga" })}
                          className="text-[11px] px-3.5 py-1.5 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors"
                        >
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
          {vencidas.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5 px-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vencidas ({vencidas.length})
              </p>
              {vencidas.map((nota, i) => (
                <div
                  key={nota.id}
                  className="glass-card rounded-2xl p-5 border-l-4 border-l-destructive hover-lift animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
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
                      <button
                        onClick={() => updateNota(nota.id, { status: "paga" })}
                        className="text-[11px] px-3.5 py-1.5 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors"
                      >
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
    </div>
  );
};

export default Alertas;
