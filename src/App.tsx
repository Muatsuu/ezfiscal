import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NFProvider } from "./contexts/NFContext";
import { EmpresaProvider } from "./contexts/EmpresaContext";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import NotasList from "./pages/NotasList";
import AddNota from "./pages/AddNota";
import Relatorios from "./pages/Relatorios";
import Calendario from "./pages/Calendario";
import Fornecedores from "./pages/Fornecedores";
import Alertas from "./pages/Alertas";
import Admin from "./pages/Admin";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { FileText, Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg glow-primary animate-pulse-soft">
      <FileText className="w-7 h-7 text-primary-foreground" />
    </div>
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm font-medium">Carregando...</span>
    </div>
  </div>
);

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <EmpresaProvider>
      <NFProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notas" element={<NotasList />} />
            <Route path="/adicionar" element={<AddNota />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/instalar" element={<InstallPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </NFProvider>
    </EmpresaProvider>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
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
