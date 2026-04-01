import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, LogIn, FileText, Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full px-4 py-3.5 pl-11 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border/50 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Left decorative panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-primary-glow/5 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary-glow/10 blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-8 shadow-2xl glow-primary">
            <FileText className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">EZ Fiscal</h2>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
            Gestão inteligente de notas fiscais para empresas que valorizam organização e controle.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-muted-foreground/60">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-xs mt-1">Seguro</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">24/7</p>
              <p className="text-xs mt-1">Disponível</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">Multi</p>
              <p className="text-xs mt-1">Empresa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4 shadow-lg glow-primary">
              <FileText className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">EZ Fiscal</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão Inteligente</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground mt-2">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-lg glow-primary hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Acesso restrito a usuários autorizados.<br />
            Solicite suas credenciais ao administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
