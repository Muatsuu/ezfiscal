import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotas } from "@/contexts/NFContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Building2, FileText, DollarSign, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
}

const Fornecedores = () => {
  const { user } = useAuth();
  const { notas } = useNotas();
  const { empresaAtiva } = useEmpresa();
  const { log } = useAuditLog();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: "", cnpj: "", contato: "", email: "", telefone: "", endereco: "", observacoes: "",
  });

  const fetchFornecedores = useCallback(async () => {
    if (!user) return;
    let query = supabase.from("fornecedores").select("*").order("nome");
    if (empresaAtiva) query = query.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await query;
    if (error) toast.error("Erro ao carregar fornecedores");
    else setFornecedores(data || []);
    setLoading(false);
  }, [user, empresaAtiva]);

  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);

  const fornecedorStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; totalPago: number }> = {};
    notas.forEach((n) => {
      const key = n.fornecedor.toLowerCase().trim();
      if (!stats[key]) stats[key] = { count: 0, total: 0, totalPago: 0 };
      stats[key].count++;
      stats[key].total += n.valor;
      if (n.status === "paga") stats[key].totalPago += n.valor;
    });
    return stats;
  }, [notas]);

  const filtered = fornecedores.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cnpj?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const resetForm = () => {
    setForm({ nome: "", cnpj: "", contato: "", email: "", telefone: "", endereco: "", observacoes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (f: Fornecedor) => {
    setEditing(f);
    setForm({
      nome: f.nome, cnpj: f.cnpj || "", contato: f.contato || "",
      email: f.email || "", telefone: f.telefone || "",
      endereco: f.endereco || "", observacoes: f.observacoes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;
    setSubmitting(true);

    if (editing) {
      const { error } = await supabase.from("fornecedores").update({
        nome: form.nome, cnpj: form.cnpj || null, contato: form.contato || null,
        email: form.email || null, telefone: form.telefone || null,
        endereco: form.endereco || null, observacoes: form.observacoes || null,
      }).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); setSubmitting(false); return; }
      toast.success("Fornecedor atualizado!");
    } else {
      const { data: newF, error } = await supabase.from("fornecedores").insert({
        user_id: user.id, nome: form.nome, cnpj: form.cnpj || null,
        contato: form.contato || null, email: form.email || null,
        telefone: form.telefone || null, endereco: form.endereco || null,
        observacoes: form.observacoes || null,
        empresa_id: empresaAtiva?.id || null,
      }).select("id").single();
      if (error) { toast.error("Erro ao cadastrar"); setSubmitting(false); return; }
      await log("criar", "fornecedor", newF?.id, { nome: form.nome });
      toast.success("Fornecedor cadastrado!");
    }
    setSubmitting(false);
    resetForm();
    fetchFornecedores();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("fornecedores").delete().eq("id", deleteId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Fornecedor excluído!");
    setDeleteId(null);
    fetchFornecedores();
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-5 pt-2 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            Fornecedores
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 ml-[52px]">{fornecedores.length} cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-xs font-semibold shadow-lg glow-primary hover:shadow-xl hover:brightness-110 transition-all duration-300 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Buscar fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          /* Skeleton */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted rounded-lg" />
                  <div className="h-3 w-28 bg-muted rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted rounded-lg" />
                  <div className="h-8 w-16 bg-muted rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Building2 className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                {search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                {search
                  ? "Tente ajustar a busca ou cadastre um novo fornecedor."
                  : "Cadastre seu primeiro fornecedor para organizar suas compras e acompanhar gastos."}
              </p>
            </div>
            {!search && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" />
                Cadastrar seu primeiro fornecedor
              </button>
            )}
          </div>
        ) : (
          filtered.map((f) => {
            const stats = fornecedorStats[f.nome.toLowerCase().trim()];
            return (
              <div
                key={f.id}
                className="glass-card rounded-2xl p-5 group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{f.nome}</p>
                        {f.cnpj && <p className="text-[11px] text-muted-foreground">{f.cnpj}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 ml-[46px] mt-1">
                      {f.telefone && <p className="text-[11px] text-muted-foreground">{f.telefone}</p>}
                      {f.email && <p className="text-[11px] text-muted-foreground">{f.email}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(f)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteId(f.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Stats badges */}
                <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2 ml-[46px]">
                  {stats ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 text-[11px] font-medium text-primary">
                        <FileText className="w-3 h-3" />
                        {stats.count} nota{stats.count !== 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/8 text-[11px] font-medium text-accent">
                        <DollarSign className="w-3 h-3" />
                        Total: {formatCurrency(stats.total)}
                      </span>
                      {stats.totalPago > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/8 text-[11px] font-medium text-success">
                          Pago: {formatCurrency(stats.totalPago)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">Sem notas vinculadas</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? "Editar" : "Novo"} Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input placeholder="Nome *" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} />
            <input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))} className={inputClass} />
            <input placeholder="Contato" value={form.contato} onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))} className={inputClass} />
            <input placeholder="E-mail" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            <input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} className={inputClass} />
            <input placeholder="Endereço" value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} className={inputClass} />
            <textarea placeholder="Observações" value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputClass + " resize-none"} />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                editing ? "Salvar Alterações" : "Cadastrar Fornecedor"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fornecedores;
