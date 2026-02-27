import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import AppSidebar from "./AppSidebar";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden max-w-[100vw]">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-md border-b border-border" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">NF Manager</h1>
            <p className="text-xs text-muted-foreground">Gestão de Notas Fiscais</p>
          </div>
          <div className="flex items-center gap-2">
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
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8 lg:py-6 pb-24 lg:pb-8 animate-fade-in max-w-7xl w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
