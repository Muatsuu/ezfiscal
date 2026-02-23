import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NFProvider } from "./contexts/NFContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import NotasList from "./pages/NotasList";
import AddNota from "./pages/AddNota";
import Relatorios from "./pages/Relatorios";
import Alertas from "./pages/Alertas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <NFProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/notas" element={<NotasList />} />
                <Route path="/adicionar" element={<AddNota />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/alertas" element={<Alertas />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </NFProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
