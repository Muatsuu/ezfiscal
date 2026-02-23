import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">NF Control</h1>
          <p className="text-xs text-muted-foreground">Gestão de Notas Fiscais</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>
      <main className="px-5 pb-24 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
