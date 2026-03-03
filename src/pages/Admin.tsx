import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Users, Building2, Plus, Trash2, Shield, Clock, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfile {
  user_id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  role?: string;
  empresas?: string[];
}

interface AuditEntry {
  id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const Admin = () => {
  const { empresas, refreshEmpresas, isAdmin } = useEmpresa();
  const { log } = useAuditLog();

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserEmpresas, setNewUserEmpresas] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Empresas state
  const [showCreateEmpresa, setShowCreateEmpresa] = useState(false);
  const [empresaForm, setEmpresaForm] = useState({ nome: "", cnpj: "", endereco: "", telefone: "" });

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Delete state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: memberships } = await supabase.from("empresa_users").select("*");

    const list: UserProfile[] = (profiles || []).map((p: any) => {
      const role = (roles || []).find((r: any) => r.user_id === p.user_id);
      const userEmpresas = (memberships || [])
        .filter((m: any) => m.user_id === p.user_id)
        .map((m: any) => m.empresa_id);
      return {
        user_id: p.user_id,
        email: p.email,
        name: p.name,
        created_at: p.created_at,
        role: role?.role || "user",
        empresas: userEmpresas,
      };
    });
    setUsers(list);
    setLoadingUsers(false);
  }, []);

  const fetchAudit = useCallback(async () => {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAuditLogs((data || []) as AuditEntry[]);
    setLoadingAudit(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAudit();
    }
  }, [isAdmin, fetchUsers, fetchAudit]);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("E-mail e senha são obrigatórios");
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setCreating(true);
    try {
      // Use edge function to create user (admin only)
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newUserEmail, password: newUserPassword, empresa_ids: newUserEmpresas },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await log("criar", "usuario", data?.user_id, { email: newUserEmail, empresas: newUserEmpresas });
      toast.success("Usuário criado com sucesso!");
      setShowCreateUser(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserEmpresas([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    }
    setCreating(false);
  };

  const handleCreateEmpresa = async () => {
    if (!empresaForm.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const { data, error } = await supabase.from("empresas").insert({
      nome: empresaForm.nome,
      cnpj: empresaForm.cnpj || null,
      endereco: empresaForm.endereco || null,
      telefone: empresaForm.telefone || null,
    }).select("id").single();

    if (error) {
      toast.error("Erro ao criar empresa");
      return;
    }
    await log("criar", "empresa", data.id, { nome: empresaForm.nome });
    toast.success("Empresa criada!");
    setShowCreateEmpresa(false);
    setEmpresaForm({ nome: "", cnpj: "", endereco: "", telefone: "" });
    refreshEmpresas();
  };

  const filteredAudit = auditLogs.filter(
    (l) =>
      !auditSearch ||
      l.user_email?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const actionLabels: Record<string, string> = {
    criar: "Criou",
    editar: "Editou",
    excluir: "Excluiu",
    status_change: "Alterou status",
    login: "Login",
    logout: "Logout",
  };

  const entityLabels: Record<string, string> = {
    nota_fiscal: "Nota Fiscal",
    fornecedor: "Fornecedor",
    empresa: "Empresa",
    usuario: "Usuário",
    auth: "Autenticação",
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Acesso restrito ao administrador</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-5 pt-2">
      <h2 className="text-2xl font-bold text-foreground">Administração</h2>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-secondary rounded-xl">
          <TabsTrigger value="users" className="rounded-lg text-xs">Usuários</TabsTrigger>
          <TabsTrigger value="empresas" className="rounded-lg text-xs">Empresas</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg text-xs">Auditoria</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{users.length} usuários</p>
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Novo Usuário
            </button>
          </div>

          <div className="space-y-3">
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              users.map((u) => (
                <div key={u.user_id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{u.email}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </div>
                      {u.empresas && u.empresas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {u.empresas.map((eId) => {
                            const emp = empresas.find((e) => e.id === eId);
                            return emp ? (
                              <span key={eId} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                {emp.nome}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Criado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Empresas Tab */}
        <TabsContent value="empresas" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{empresas.length} empresas</p>
            <button
              onClick={() => setShowCreateEmpresa(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Nova Empresa
            </button>
          </div>

          <div className="space-y-3">
            {empresas.map((e) => (
              <div key={e.id} className="glass-card rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground">{e.nome}</p>
                {e.cnpj && <p className="text-xs text-muted-foreground mt-0.5">{e.cnpj}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {users.filter((u) => u.empresas?.includes(e.id)).length} usuários vinculados
                </p>
              </div>
            ))}
            {empresas.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Buscar no log..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            {loadingAudit ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : filteredAudit.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            ) : (
              filteredAudit.map((entry) => (
                <div key={entry.id} className="glass-card rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      <span className="text-primary">{entry.user_email || "Sistema"}</span>
                      {" "}
                      {actionLabels[entry.action] || entry.action}
                      {" "}
                      <span className="text-muted-foreground">
                        {entityLabels[entry.entity_type] || entry.entity_type}
                      </span>
                    </p>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {JSON.stringify(entry.details).slice(0, 100)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(entry.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              placeholder="E-mail *"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Senha (mín. 6 caracteres) *"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className={inputClass}
            />
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Vincular às empresas:</label>
              <div className="space-y-2">
                {empresas.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserEmpresas.includes(e.id)}
                      onChange={(ev) => {
                        setNewUserEmpresas((prev) =>
                          ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id)
                        );
                      }}
                      className="rounded"
                    />
                    {e.nome}
                    {e.cnpj && <span className="text-xs text-muted-foreground">({e.cnpj})</span>}
                  </label>
                ))}
                {empresas.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma empresa cadastrada. Crie uma primeiro.</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateUser}
              disabled={creating}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {creating ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Empresa Dialog */}
      <Dialog open={showCreateEmpresa} onOpenChange={setShowCreateEmpresa}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input placeholder="Nome da empresa *" value={empresaForm.nome} onChange={(e) => setEmpresaForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} />
            <input placeholder="CNPJ" value={empresaForm.cnpj} onChange={(e) => setEmpresaForm((f) => ({ ...f, cnpj: e.target.value }))} className={inputClass} />
            <input placeholder="Endereço" value={empresaForm.endereco} onChange={(e) => setEmpresaForm((f) => ({ ...f, endereco: e.target.value }))} className={inputClass} />
            <input placeholder="Telefone" value={empresaForm.telefone} onChange={(e) => setEmpresaForm((f) => ({ ...f, telefone: e.target.value }))} className={inputClass} />
            <button onClick={handleCreateEmpresa} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              Criar Empresa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
