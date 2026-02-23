import { Share, Plus, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InstallPage = () => {
  const navigate = useNavigate();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (isStandalone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">App já instalado!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Você já está usando o NF Control como app.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          Ir para o Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 space-y-6">
      <img src="/pwa-icon-512.png" alt="NF Control" className="w-24 h-24 rounded-3xl shadow-lg" />

      <div>
        <h2 className="text-2xl font-bold text-foreground">Instalar NF Control</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Instale o app no seu celular para acesso rápido, offline e sem precisar da App Store.
        </p>
      </div>

      {isIOS ? (
        <div className="glass-card rounded-2xl p-5 space-y-4 text-left w-full max-w-sm">
          <h3 className="text-sm font-semibold text-foreground">No iPhone / iPad:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Toque no ícone <Share className="w-4 h-4 inline text-primary" /> <strong>Compartilhar</strong> na barra do Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Role para baixo e toque em <Plus className="w-4 h-4 inline text-primary" /> <strong>Adicionar à Tela de Início</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Toque em <strong>Adicionar</strong> no canto superior direito
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 space-y-4 text-left w-full max-w-sm">
          <h3 className="text-sm font-semibold text-foreground">No Android:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-sm text-foreground">
                Toque no menu <strong>⋮</strong> do navegador
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-sm text-foreground">
                Toque em <ArrowDown className="w-4 h-4 inline text-primary" /> <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/")}
        className="text-sm text-primary font-medium"
      >
        Continuar no navegador →
      </button>
    </div>
  );
};

export default InstallPage;
