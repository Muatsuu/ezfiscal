import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, PlusCircle, CalendarDays, BarChart3 } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Início" },
  { to: "/notas", icon: FileText, label: "NFs" },
  { to: "/adicionar", icon: PlusCircle, label: "Nova", isAdd: true },
  { to: "/calendario", icon: CalendarDays, label: "Agenda" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 py-1.5 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, isAdd }) => {
          const isActive = location.pathname === to;

          if (isAdd) {
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center justify-center gap-0.5 py-1"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg glow-primary -mt-6 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-1">{label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200"
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary stroke-[2.5]" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-gradient-to-r from-primary to-primary-glow mt-0.5" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
