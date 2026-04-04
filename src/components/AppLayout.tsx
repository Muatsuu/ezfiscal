import { ReactNode, useMemo } from "react";
import BottomNav from "./BottomNav";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import CommandPalette from "./CommandPalette";
import EmpresaSelector from "./EmpresaSelector";
import { Moon, Sun, LogOut, Shield, BellRing, Command } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useNotas } from "@/contexts/NFContext";
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { isAdmin } = useEmpresa();
  const { notas } = useNotas();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden max-w-[100vw]">
      <AppSidebar />
      <CommandPalette />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] overflow-x-hidden max-w-[100vw] lg:max-w-[calc(100vw-260px)]">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 w-full" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.25rem)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">EZ Fiscal</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.12em]">Gestão Inteligente</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/alertas")}
                className="relative p-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BellRing className="w-4 h-4" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center font-bold ring-2 ring-background animate-pulse-soft">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-primary transition-colors"
                  title="Administração"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={signOut}
                className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <EmpresaSelector />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-3 lg:px-8 lg:py-4 pb-28 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <TopBar />
          <div className="animate-fade-in overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
