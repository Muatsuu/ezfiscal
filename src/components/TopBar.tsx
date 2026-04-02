import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useNotas } from "@/contexts/NFContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  LayoutDashboard, FileText, CalendarDays, Building2, BarChart3,
  BellRing, Shield, ChevronRight, Command, Zap,
} from "lucide-react";

const routeMap: Record<string, { label: string; icon: React.ElementType }> = {
  "/": { label: "Dashboard", icon: LayoutDashboard },
  "/notas": { label: "Notas Fiscais", icon: FileText },
  "/adicionar": { label: "Nova Nota", icon: FileText },
  "/calendario": { label: "Calendário", icon: CalendarDays },
  "/fornecedores": { label: "Fornecedores", icon: Building2 },
  "/relatorios": { label: "Relatórios", icon: BarChart3 },
  "/alertas": { label: "Alertas", icon: BellRing },
  "/admin": { label: "Administração", icon: Shield },
};

const TopBar = () => {
  const location = useLocation();
  const { notas } = useNotas();
  const { empresaAtiva } = useEmpresa();

  const route = routeMap[location.pathname] || { label: "Página", icon: Zap };

  const quickStats = useMemo(() => {
    const pendentes = notas.filter((n) => n.status === "pendente" || n.status === "vencida");
    const totalPendente = pendentes.reduce((s, n) => s + n.valor, 0);
    const vencidas = notas.filter((n) => n.status === "vencida").length;
    return { pendentes: pendentes.length, totalPendente, vencidas };
  }, [notas]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="hidden lg:flex items-center justify-between py-3 px-1 mb-2 border-b border-border/30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">
          {empresaAtiva?.nome || "EZ Fiscal"}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <div className="flex items-center gap-1.5">
          <route.icon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{route.label}</span>
        </div>
      </div>

      {/* Quick stats + shortcut hint */}
      <div className="flex items-center gap-4">
        {/* Live KPI pills */}
        {quickStats.pendentes > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/8 text-warning">
              <span className="text-[11px] font-semibold">{quickStats.pendentes} pendentes</span>
              <span className="text-[10px] font-mono font-bold">{formatCurrency(quickStats.totalPendente)}</span>
            </div>
            {quickStats.vencidas > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/8 text-destructive">
                <span className="text-[11px] font-semibold">{quickStats.vencidas} vencida{quickStats.vencidas > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        )}

        {/* Cmd+K hint */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Buscar</span>
          <kbd className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
