import { NotaFiscal } from "@/types/notaFiscal";
import { createContext, useContext, useState, ReactNode } from "react";

interface NFContextType {
  notas: NotaFiscal[];
  addNota: (nota: NotaFiscal) => void;
  removeNota: (id: string) => void;
  updateNota: (id: string, nota: Partial<NotaFiscal>) => void;
}

const NFContext = createContext<NFContextType>({
  notas: [],
  addNota: () => {},
  removeNota: () => {},
  updateNota: () => {},
});

export const useNotas = () => useContext(NFContext);

const initialNotas: NotaFiscal[] = [
  {
    id: "1",
    numero: "NF-001",
    tipo: "fornecedor",
    fornecedor: "Tech Solutions LTDA",
    valor: 4500.0,
    setor: "TI",
    dataEmissao: "2026-02-10",
    dataVencimento: "2026-02-25",
    status: "pendente",
    descricao: "Licenças de software",
  },
  {
    id: "2",
    numero: "NF-002",
    tipo: "servico",
    fornecedor: "Clean Pro Serviços",
    valor: 2800.0,
    setor: "Manutenção",
    dataEmissao: "2026-02-05",
    dataVencimento: "2026-02-28",
    status: "pendente",
    descricao: "Serviço de limpeza mensal",
  },
  {
    id: "3",
    numero: "NF-003",
    tipo: "fornecedor",
    fornecedor: "Papelaria Central",
    valor: 890.5,
    setor: "Administrativo",
    dataEmissao: "2026-02-01",
    dataVencimento: "2026-02-20",
    status: "vencida",
    descricao: "Material de escritório",
  },
  {
    id: "4",
    numero: "NF-004",
    tipo: "servico",
    fornecedor: "MKT Digital Agency",
    valor: 12000.0,
    setor: "Marketing",
    dataEmissao: "2026-01-15",
    dataVencimento: "2026-02-15",
    status: "paga",
    descricao: "Campanha publicitária Q1",
  },
  {
    id: "5",
    numero: "NF-005",
    tipo: "fornecedor",
    fornecedor: "Transportes Rápido",
    valor: 3200.0,
    setor: "Logística",
    dataEmissao: "2026-02-18",
    dataVencimento: "2026-02-26",
    status: "pendente",
    descricao: "Frete de mercadorias",
  },
];

export const NFProvider = ({ children }: { children: ReactNode }) => {
  const [notas, setNotas] = useState<NotaFiscal[]>(initialNotas);

  const addNota = (nota: NotaFiscal) => setNotas((prev) => [nota, ...prev]);
  const removeNota = (id: string) => setNotas((prev) => prev.filter((n) => n.id !== id));
  const updateNota = (id: string, updates: Partial<NotaFiscal>) =>
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));

  return (
    <NFContext.Provider value={{ notas, addNota, removeNota, updateNota }}>
      {children}
    </NFContext.Provider>
  );
};
