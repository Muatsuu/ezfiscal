import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full px-4 py-3 pl-11 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">NF Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de Notas Fiscais</p>
        </div>

        <div className="flex gap-2">
          {(["login", "cadastro"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setIsLogin(tab === "login")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                (tab === "login") === isLogin
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {tab === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Carregando..."
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" /> Entrar
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Cadastrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
