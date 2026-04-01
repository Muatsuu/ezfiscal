import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, BarChart3, CalendarDays, Building2,
  PlusCircle, Sun, Moon, LogOut, Shield, BellRing, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useNotas } from "@/contexts/NFContext";
import EmpresaSelector from "./EmpresaSelector";
import AddNotaModal from "./AddNotaModal";
import { useState, useMemo } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/notas", icon: FileText, label: "Notas Fiscais" },
  { to: "/calendario", icon: CalendarDays, label: "Calendário" },
  { to: "/fornecedores", icon: Building2, label: "Fornecedores" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
];

const AppSidebar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin } = useEmpresa();
  const { notas } = useNotas();
  const [showAddModal, setShowAddModal] = useState(false);

  const alertCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDays = new Date(today);
    threeDays.setDate(today.getDate() + 3);
    return notas.filter((n) => {
      if (n.status === "vencida") return true;
      if (n.status === "pendente") {
        const v = new Date(n.dataVencimento);
        return v >= today && v <= threeDays;
      }
      return false;
    }).length;
  }, [notas]);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[260px] h-screen fixed top-0 left-0 bg-sidebar border-r border-sidebar-border z-40">
        {/* Logo */}
        <div className="flex items-center gap-3.5 px-6 py-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg glow-primary">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-foreground tracking-tight">EZ Fiscal</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">Gestão Inteligente</p>
          </div>
        </div>

        {/* Empresa Selector */}
        <div className="px-5 mb-4">
          <EmpresaSelector />
        </div>

        {/* Add button */}
        <div className="px-5 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-lg glow-primary hover:shadow-xl hover:brightness-110 transition-all duration-300 active:scale-[0.98]"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Nova Nota Fiscal
          </button>
        </div>

        {/* Section label */}
        <div className="px-6 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">Menu</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/12 text-primary shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? "bg-primary/15" : "bg-transparent group-hover:bg-sidebar-accent"
                }`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1">{label}</span>
                {isActive && (
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-primary to-primary-glow" />
                )}
              </NavLink>
            );
          })}

          {/* Alertas */}
          <NavLink
            to="/alertas"
            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              location.pathname === "/alertas"
                ? "bg-primary/12 text-primary shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          >
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              location.pathname === "/alertas" ? "bg-primary/15" : "bg-transparent group-hover:bg-sidebar-accent"
            }`}>
              <BellRing className="w-[18px] h-[18px]" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold ring-2 ring-sidebar animate-pulse-soft">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </div>
            <span className="flex-1">Alertas</span>
            {alertCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                {alertCount}
              </span>
            )}
          </NavLink>

          {/* Admin link */}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-1">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">Admin</span>
              </div>
              <NavLink
                to="/admin"
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  location.pathname === "/admin"
                    ? "bg-primary/12 text-primary shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  location.pathname === "/admin" ? "bg-primary/15" : "bg-transparent group-hover:bg-sidebar-accent"
                }`}>
                  <Shield className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1">Administração</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="px-5 pb-5 space-y-3">
          {/* Theme toggle */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-sidebar-accent transition-all duration-200 text-muted-foreground hover:text-foreground"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User section */}
          <div className="border-t border-sidebar-border pt-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center text-primary font-bold text-sm">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {user?.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showAddModal && <AddNotaModal onClose={() => setShowAddModal(false)} />}
    </>
  );
};

export default AppSidebar;
