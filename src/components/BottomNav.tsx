import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, PlusCircle, CalendarDays, BarChart3 } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Início" },
  { to: "/notas", icon: FileText, label: "NFs" },
  { to: "/adicionar", icon: PlusCircle, label: "Nova" },
  { to: "/calendario", icon: CalendarDays, label: "Calendário" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isAdd = to === "/adicionar";

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 ${
                isActive && !isAdd
                  ? "text-primary"
                  : !isAdd
                  ? "text-muted-foreground hover:text-foreground"
                  : ""
              }`}
            >
              {isAdd ? (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 -mt-5">
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              )}
              <span className={`text-[10px] font-medium ${isAdd ? "mt-1" : ""}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
