import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-md" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">NF Control</h1>
          <p className="text-xs text-muted-foreground">Gestão de Notas Fiscais</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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
      <main className="px-5 pb-24 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
