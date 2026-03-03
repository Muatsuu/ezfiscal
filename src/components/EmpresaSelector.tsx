import { useEmpresa } from "@/contexts/EmpresaContext";
import { Building2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const EmpresaSelector = () => {
  const { empresas, empresaAtiva, setEmpresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (empresas.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors w-full"
      >
        <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="truncate flex-1 text-left">{empresaAtiva?.nome || "Selecionar"}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {empresas.map((e) => (
            <button
              key={e.id}
              onClick={() => { setEmpresaAtiva(e); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-xs hover:bg-secondary transition-colors ${
                empresaAtiva?.id === e.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
              }`}
            >
              <p className="font-medium">{e.nome}</p>
              {e.cnpj && <p className="text-[10px] text-muted-foreground">{e.cnpj}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmpresaSelector;
