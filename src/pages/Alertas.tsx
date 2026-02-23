import { useNotas } from "@/contexts/NFContext";
import { useMemo } from "react";
import { Bell, BellRing, AlertTriangle, CheckCircle } from "lucide-react";

const Alertas = () => {
  const { notas, updateNota } = useNotas();

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
    const diff = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <BellRing className="w-5 h-5 text-warning" />
        Alertas
      </h2>

      {aVencer.length === 0 && vencidas.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 mx-auto text-success/50 mb-3" />
          <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Nenhuma nota a vencer nos próximos 3 dias
          </p>
        </div>
      ) : (
        <>
          {/* A vencer */}
          {aVencer.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Vencendo em até 3 dias ({aVencer.length})
              </p>
              {aVencer.map((nota) => {
                const dias = diasParaVencer(nota.dataVencimento);
                return (
                  <div
                    key={nota.id}
                    className="rounded-xl border-l-4 border-l-warning glass-card p-4 animate-fade-in"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {nota.numero} · {nota.setor}
                        </p>
                        <p className="text-xs mt-1.5 font-medium text-warning">
                          {dias === 0
                            ? "Vence hoje!"
                            : dias === 1
                            ? "Vence amanhã"
                            : `Vence em ${dias} dias`}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(nota.valor)}
                        </p>
                        <button
                          onClick={() => updateNota(nota.id, { status: "paga" })}
                          className="mt-2 text-[10px] px-3 py-1 rounded-lg bg-success/10 text-success font-medium"
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
            <div className="space-y-3">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                Vencidas ({vencidas.length})
              </p>
              {vencidas.map((nota) => (
                <div
                  key={nota.id}
                  className="rounded-xl border-l-4 border-l-destructive glass-card p-4 animate-fade-in"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{nota.fornecedor}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {nota.numero} · {nota.setor}
                      </p>
                      <p className="text-xs mt-1.5 text-destructive font-medium">
                        Venceu em{" "}
                        {new Date(nota.dataVencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(nota.valor)}
                      </p>
                      <button
                        onClick={() => updateNota(nota.id, { status: "paga" })}
                        className="mt-2 text-[10px] px-3 py-1 rounded-lg bg-success/10 text-success font-medium"
                      >
                        Marcar paga
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Alertas;
