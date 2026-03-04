import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import AppSidebar from "./AppSidebar";
import EmpresaSelector from "./EmpresaSelector";
import { Moon, Sun, LogOut, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { isAdmin } = useEmpresa();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden max-w-[100vw]">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[240px] overflow-x-hidden max-w-[100vw] lg:max-w-[calc(100vw-240px)]">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border w-full" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">NF Manager</h1>
              <p className="text-xs text-muted-foreground">Gestão de Notas Fiscais</p>
            </div>
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Administração"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Mobile Empresa Selector */}
          <div className="px-4 pb-3">
            <EmpresaSelector />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8 lg:py-6 pb-24 lg:pb-8 animate-fade-in max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
