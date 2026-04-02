import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotas } from "@/contexts/NFContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, FileText, CalendarDays, Building2, BarChart3,
  BellRing, Shield, PlusCircle, Search, Sun, Moon, LogOut,
  ArrowRight, Command, Hash,
} from "lucide-react";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { notas } = useNotas();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); }
  }, [open]);

  const pages = useMemo(() => [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/", group: "Navegação" },
    { id: "notas", label: "Notas Fiscais", icon: FileText, path: "/notas", group: "Navegação" },
    { id: "calendario", label: "Calendário", icon: CalendarDays, path: "/calendario", group: "Navegação" },
    { id: "fornecedores", label: "Fornecedores", icon: Building2, path: "/fornecedores", group: "Navegação" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/relatorios", group: "Navegação" },
    { id: "alertas", label: "Alertas", icon: BellRing, path: "/alertas", group: "Navegação" },
    { id: "admin", label: "Administração", icon: Shield, path: "/admin", group: "Navegação" },
  ], []);

  const actions = useMemo(() => [
    { id: "new-nota", label: "Nova Nota Fiscal", icon: PlusCircle, action: () => navigate("/adicionar"), group: "Ações" },
    { id: "toggle-theme", label: theme === "dark" ? "Modo Claro" : "Modo Escuro", icon: theme === "dark" ? Sun : Moon, action: () => { toggleTheme(); setOpen(false); }, group: "Ações" },
    { id: "logout", label: "Sair do Sistema", icon: LogOut, action: () => { signOut(); setOpen(false); }, group: "Ações" },
  ], [theme, toggleTheme, signOut, navigate]);

  const notaResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return notas
      .filter((n) => n.fornecedor.toLowerCase().includes(q) || n.numero.toLowerCase().includes(q))
      .slice(0, 5)
      .map((n) => ({
        id: `nota-${n.id}`,
        label: `${n.numero} — ${n.fornecedor}`,
        icon: Hash,
        action: () => navigate("/notas"),
        group: "Notas Fiscais",
        subtitle: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n.valor),
      }));
  }, [query, notas, navigate]);

  const allItems = useMemo(() => {
    const q = query.toLowerCase();
    const filteredPages = pages.filter((p) => p.label.toLowerCase().includes(q));
    const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(q));
    return [...filteredPages.map((p) => ({ ...p, action: () => navigate(p.path) })), ...filteredActions, ...notaResults];
  }, [query, pages, actions, notaResults, navigate]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleSelect = useCallback((item: typeof allItems[0]) => {
    item.action();
    setOpen(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[selectedIndex]) { handleSelect(allItems[selectedIndex]); }
  };

  if (!open) return null;

  const groups = allItems.reduce((acc, item) => {
    const g = item.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "var(--shadow-elevated), 0 0 80px -20px hsl(var(--primary) / 0.15)" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, notas, ações..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="px-5 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">{group}</p>
                {items.map((item) => {
                  const idx = allItems.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        idx === selectedIndex ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{item.label}</span>
                        {"subtitle" in item && item.subtitle && (
                          <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                        )}
                      </div>
                      {idx === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-5 py-2.5 flex items-center gap-4 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1"><Command className="w-3 h-3" />K para abrir</span>
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
