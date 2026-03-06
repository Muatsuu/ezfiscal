import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useNotas } from "@/contexts/NFContext";
import { Search, Plus, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FornecedorOption {
  id: string;
  nome: string;
  cnpj: string | null;
}

interface FornecedorComboboxProps {
  value: string;
  onChange: (nome: string) => void;
  onSetorSuggestion?: (setor: string) => void;
  className?: string;
}

const FornecedorCombobox = ({ value, onChange, onSetorSuggestion, className }: FornecedorComboboxProps) => {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { notas } = useNotas();
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const fetchFornecedores = useCallback(async () => {
    if (!user) return;
    let query = supabase.from("fornecedores").select("id, nome, cnpj").order("nome");
    if (empresaAtiva) query = query.eq("empresa_id", empresaAtiva.id);
    const { data } = await query;
    setFornecedores(data || []);
  }, [user, empresaAtiva]);

  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = fornecedores.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cnpj?.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = fornecedores.some((f) => f.nome.toLowerCase() === search.toLowerCase());

  const suggestSetorFromHistory = (fornecedorNome: string) => {
    if (!onSetorSuggestion) return;
    const matching = notas
      .filter((n) => n.fornecedor.toLowerCase().trim() === fornecedorNome.toLowerCase().trim())
      .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
    if (matching.length > 0) {
      onSetorSuggestion(matching[0].setor);
    }
  };

  const handleSelect = (nome: string) => {
    onChange(nome);
    setSearch(nome);
    setOpen(false);
    suggestSetorFromHistory(nome);
  };

  const handleCreate = async () => {
    if (!user || !search.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("fornecedores").insert({
      user_id: user.id,
      nome: search.trim(),
      empresa_id: empresaAtiva?.id || null,
    });
    if (error) {
      toast.error("Erro ao cadastrar fornecedor");
    } else {
      toast.success(`Fornecedor "${search.trim()}" cadastrado!`);
      await fetchFornecedores();
      onChange(search.trim());
      setOpen(false);
    }
    setCreating(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Buscar ou criar fornecedor..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={`pl-9 ${className}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl max-h-52 overflow-y-auto animate-fade-in">
          {/* Quick create option */}
          {search.trim() && !exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border-b border-border/30"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Cadastrar "<strong>{search.trim()}</strong>"</span>
            </button>
          )}

          {filtered.length === 0 && !search.trim() && (
            <div className="px-3.5 py-4 text-center">
              <Building2 className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">Nenhum fornecedor cadastrado</p>
            </div>
          )}

          {filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelect(f.nome)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors ${
                value.toLowerCase() === f.nome.toLowerCase() ? "bg-primary/5 text-primary font-medium" : "text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{f.nome}</p>
                {f.cnpj && <p className="text-[10px] text-muted-foreground">{f.cnpj}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FornecedorCombobox;
