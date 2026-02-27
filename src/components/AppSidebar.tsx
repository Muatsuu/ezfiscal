import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, BarChart3, PlusCircle, Sun, Moon, LogOut, Smartphone } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/notas", icon: FileText, label: "Notas Fiscais" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen fixed top-0 left-0 bg-sidebar border-r border-sidebar-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">NF Manager</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Gestão de Notas</p>
        </div>
        <button
          onClick={toggleTheme}
          className="ml-auto p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{label}</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5 space-y-3">
        <button
          onClick={() => navigate("/adicionar")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Nota Fiscal
        </button>

        {!isStandalone && (
          <NavLink
            to="/instalar"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Instalar no iPhone
          </NavLink>
        )}

        <div className="border-t border-sidebar-border pt-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
