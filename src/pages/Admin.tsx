import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import {
  Users, Building2, Plus, Shield, Clock, Search, Activity,
  UserPlus, Mail, Lock, Loader2, Hash, ChevronRight, ArrowUpRight,
} from "lucide-react";
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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserEmpresas, setNewUserEmpresas] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [showCreateEmpresa, setShowCreateEmpresa] = useState(false);
  const [empresaForm, setEmpresaForm] = useState({ nome: "", cnpj: "", endereco: "", telefone: "" });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(true);

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
        user_id: p.user_id, email: p.email, name: p.name,
        created_at: p.created_at, role: role?.role || "user", empresas: userEmpresas,
      };
    });
    setUsers(list);
    setLoadingUsers(false);
  }, []);

  const fetchAudit = useCallback(async () => {
    const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    setAuditLogs((data || []) as AuditEntry[]);
    setLoadingAudit(false);
  }, []);

  useEffect(() => {
    if (isAdmin) { fetchUsers(); fetchAudit(); }
  }, [isAdmin, fetchUsers, fetchAudit]);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) { toast.error("E-mail e senha são obrigatórios"); return; }
    if (newUserPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newUserEmail, password: newUserPassword, empresa_ids: newUserEmpresas },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await log("criar", "usuario", data?.user_id, { email: newUserEmail, empresas: newUserEmpresas });
      toast.success("Usuário criado com sucesso!");
      setShowCreateUser(false); setNewUserEmail(""); setNewUserPassword(""); setNewUserEmpresas([]);
      fetchUsers();
    } catch (err: any) { toast.error(err.message || "Erro ao criar usuário"); }
    setCreating(false);
  };

  const handleCreateEmpresa = async () => {
    if (!empresaForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    const { data, error } = await supabase.from("empresas").insert({
      nome: empresaForm.nome, cnpj: empresaForm.cnpj || null,
      endereco: empresaForm.endereco || null, telefone: empresaForm.telefone || null,
    }).select("id").single();
    if (error) { toast.error("Erro ao criar empresa"); return; }
    await log("criar", "empresa", data.id, { nome: empresaForm.nome });
    toast.success("Empresa criada!");
    setShowCreateEmpresa(false); setEmpresaForm({ nome: "", cnpj: "", endereco: "", telefone: "" });
    refreshEmpresas();
  };

  const filteredAudit = auditLogs.filter((l) =>
    !auditSearch ||
    l.user_email?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const actionLabels: Record<string, string> = {
    criar: "Criou", editar: "Editou", excluir: "Excluiu",
    status_change: "Alterou status", login: "Login", logout: "Logout",
  };
  const entityLabels: Record<string, string> = {
    nota_fiscal: "Nota Fiscal", fornecedor: "Fornecedor",
    empresa: "Empresa", usuario: "Usuário", auth: "Autenticação",
  };

  const actionColors: Record<string, string> = {
    criar: "text-success bg-success/10",
    editar: "text-primary bg-primary/10",
    excluir: "text-destructive bg-destructive/10",
    status_change: "text-warning bg-warning/10",
    login: "text-success bg-success/10",
    logout: "text-muted-foreground bg-muted",
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">Acesso Restrito</p>
          <p className="text-sm text-muted-foreground">Esta área é reservada para administradores.</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  // Stats
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const recentActivity = auditLogs.slice(0, 1)[0];

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            Administração
          </h2>
          <p className="text-xs text-muted-foreground mt-1 ml-[52px]">Gerencie usuários, empresas e auditoria</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Usuários</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{adminCount} admin · {userCount} usuário{userCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Empresas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{empresas.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">cadastrada{empresas.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-success/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-success" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Registros</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{auditLogs.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">no log de auditoria</p>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-warning/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Última ação</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1 truncate">
            {recentActivity ? `${actionLabels[recentActivity.action] || recentActivity.action}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {recentActivity ? new Date(recentActivity.created_at).toLocaleString("pt-BR") : "Sem atividade"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-secondary rounded-xl h-11">
          <TabsTrigger value="users" className="rounded-lg text-xs font-semibold gap-1.5">
            <Users className="w-3.5 h-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="empresas" className="rounded-lg text-xs font-semibold gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Empresas
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-medium">{users.length} usuários cadastrados</p>
            <button onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-xs font-semibold shadow-lg glow-primary hover:brightness-110 transition-all">
              <UserPlus className="w-4 h-4" /> Novo Usuário
            </button>
          </div>

          <div className="space-y-3">
            {loadingUsers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted" />
                    <div className="space-y-2 flex-1"><div className="h-4 w-40 bg-muted rounded-lg" /><div className="h-3 w-28 bg-muted rounded-lg" /></div>
                  </div>
                </div>
              ))
            ) : (
              users.map((u) => (
                <div key={u.user_id} className="glass-card rounded-2xl p-5 group hover-lift gradient-border animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {u.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{u.email}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </div>
                      {u.empresas && u.empresas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {u.empresas.map((eId) => {
                            const emp = empresas.find((e) => e.id === eId);
                            return emp ? (
                              <span key={eId} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/8 text-accent font-medium">
                                {emp.nome}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Empresas Tab */}
        <TabsContent value="empresas" className="space-y-4 mt-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-medium">{empresas.length} empresas</p>
            <button onClick={() => setShowCreateEmpresa(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-xs font-semibold shadow-lg glow-primary hover:brightness-110 transition-all">
              <Plus className="w-4 h-4" /> Nova Empresa
            </button>
          </div>

          <div className="space-y-3">
            {empresas.map((e) => {
              const memberCount = users.filter((u) => u.empresas?.includes(e.id)).length;
              return (
                <div key={e.id} className="glass-card rounded-2xl p-5 group hover-lift gradient-border animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{e.nome}</p>
                      {e.cnpj && <p className="text-[11px] text-muted-foreground font-mono">{e.cnpj}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary">
                        {memberCount} membro{memberCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {(e.endereco || e.telefone) && (
                    <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-4 ml-[52px] text-[11px] text-muted-foreground">
                      {e.endereco && <span>{e.endereco}</span>}
                      {e.telefone && <span>{e.telefone}</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {empresas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Building2 className="w-9 h-9 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground mb-1">Nenhuma empresa cadastrada</p>
                  <p className="text-xs text-muted-foreground">Crie sua primeira empresa para organizar o acesso.</p>
                </div>
                <button onClick={() => setShowCreateEmpresa(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Criar primeira empresa
                </button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4 mt-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Buscar no log de auditoria..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-6 bottom-0 w-px bg-border/40 hidden lg:block" />

            <div className="space-y-2">
              {loadingAudit ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted" />
                    <div className="space-y-2 flex-1"><div className="h-3 w-48 bg-muted rounded" /><div className="h-2.5 w-32 bg-muted rounded" /></div>
                  </div>
                ))
              ) : filteredAudit.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
                </div>
              ) : (
                filteredAudit.map((entry, i) => (
                  <div key={entry.id} className="glass-card rounded-xl p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${actionColors[entry.action] || "bg-muted text-muted-foreground"}`}>
                      {entry.action === "criar" ? <Plus className="w-4 h-4" /> :
                       entry.action === "excluir" ? <Hash className="w-4 h-4" /> :
                       entry.action === "login" ? <ArrowUpRight className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        <span className="text-primary font-semibold">{entry.user_email || "Sistema"}</span>
                        {" "}
                        <span className="text-muted-foreground">{actionLabels[entry.action] || entry.action}</span>
                        {" "}
                        <span className="font-semibold">{entityLabels[entry.entity_type] || entry.entity_type}</span>
                      </p>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">
                          {JSON.stringify(entry.details).slice(0, 120)}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(entry.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="usuario@empresa.com" type="email" value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={inputClass + " pl-10"} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Mínimo 6 caracteres" type="password" value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)} className={inputClass + " pl-10"} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Vincular às empresas</label>
              <div className="space-y-2">
                {empresas.map((e) => (
                  <label key={e.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    newUserEmpresas.includes(e.id) ? "bg-primary/8 border border-primary/20" : "bg-secondary border border-transparent hover:border-border/50"
                  }`}>
                    <input type="checkbox" checked={newUserEmpresas.includes(e.id)}
                      onChange={(ev) => setNewUserEmpresas((prev) => ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id))}
                      className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      newUserEmpresas.includes(e.id) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}>
                      {newUserEmpresas.includes(e.id) && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.nome}</p>
                      {e.cnpj && <p className="text-[10px] text-muted-foreground">{e.cnpj}</p>}
                    </div>
                  </label>
                ))}
                {empresas.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">Nenhuma empresa cadastrada. Crie uma primeiro.</p>
                )}
              </div>
            </div>
            <button onClick={handleCreateUser} disabled={creating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg glow-primary hover:brightness-110 transition-all">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar Usuário"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Empresa Dialog */}
      <Dialog open={showCreateEmpresa} onOpenChange={setShowCreateEmpresa}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" /> Nova Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome da empresa</label>
              <input placeholder="Razão social ou nome fantasia" value={empresaForm.nome}
                onChange={(e) => setEmpresaForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CNPJ</label>
              <input placeholder="00.000.000/0000-00" value={empresaForm.cnpj}
                onChange={(e) => setEmpresaForm((f) => ({ ...f, cnpj: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endereço</label>
                <input placeholder="Cidade, UF" value={empresaForm.endereco}
                  onChange={(e) => setEmpresaForm((f) => ({ ...f, endereco: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefone</label>
                <input placeholder="(00) 00000-0000" value={empresaForm.telefone}
                  onChange={(e) => setEmpresaForm((f) => ({ ...f, telefone: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <button onClick={handleCreateEmpresa}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-lg glow-primary hover:brightness-110 transition-all">
              Criar Empresa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
