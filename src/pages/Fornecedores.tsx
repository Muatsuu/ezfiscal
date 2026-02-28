import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotas } from "@/contexts/NFContext";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Building2, TrendingUp, X } from "lucide-react";
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
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "", cnpj: "", contato: "", email: "", telefone: "", endereco: "", observacoes: "",
  });

  const fetchFornecedores = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .order("nome");
    if (error) {
      toast.error("Erro ao carregar fornecedores");
    } else {
      setFornecedores(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);

  const fornecedorStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; avg: number }> = {};
    notas.forEach((n) => {
      const key = n.fornecedor.toLowerCase().trim();
      if (!stats[key]) stats[key] = { count: 0, total: 0, avg: 0 };
      stats[key].count++;
      stats[key].total += n.valor;
    });
    Object.values(stats).forEach((s) => { s.avg = s.total / s.count; });
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
      nome: f.nome,
      cnpj: f.cnpj || "",
      contato: f.contato || "",
      email: f.email || "",
      telefone: f.telefone || "",
      endereco: f.endereco || "",
      observacoes: f.observacoes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;

    if (editing) {
      const { error } = await supabase.from("fornecedores").update({
        nome: form.nome, cnpj: form.cnpj || null, contato: form.contato || null,
        email: form.email || null, telefone: form.telefone || null,
        endereco: form.endereco || null, observacoes: form.observacoes || null,
      }).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Fornecedor atualizado!");
    } else {
      const { error } = await supabase.from("fornecedores").insert({
        user_id: user.id, nome: form.nome, cnpj: form.cnpj || null,
        contato: form.contato || null, email: form.email || null,
        telefone: form.telefone || null, endereco: form.endereco || null,
        observacoes: form.observacoes || null,
      });
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Fornecedor cadastrado!");
    }
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
          <h2 className="text-2xl font-bold text-foreground">Fornecedores</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{fornecedores.length} cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
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
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          filtered.map((f) => {
            const stats = fornecedorStats[f.nome.toLowerCase().trim()];
            return (
              <div key={f.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{f.nome}</p>
                    {f.cnpj && <p className="text-xs text-muted-foreground mt-0.5">{f.cnpj}</p>}
                    {f.telefone && <p className="text-xs text-muted-foreground">{f.telefone}</p>}
                    {f.email && <p className="text-xs text-muted-foreground">{f.email}</p>}
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <button onClick={() => openEdit(f)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteId(f.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {stats && (
                  <div className="mt-3 pt-3 border-t border-border/30 flex gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Compras</p>
                      <p className="text-sm font-semibold text-foreground">{stats.count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(stats.total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Ticket Médio</p>
                      <p className="text-sm font-semibold text-primary">{formatCurrency(stats.avg)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
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
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              {editing ? "Salvar Alterações" : "Cadastrar Fornecedor"}
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
