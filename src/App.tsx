import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NFProvider } from "./contexts/NFContext";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import NotasList from "./pages/NotasList";
import AddNota from "./pages/AddNota";
import Relatorios from "./pages/Relatorios";
import Alertas from "./pages/Alertas";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <NFProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notas" element={<NotasList />} />
          <Route path="/adicionar" element={<AddNota />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/instalar" element={<InstallPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </NFProvider>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
