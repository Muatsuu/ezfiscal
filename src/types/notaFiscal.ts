export interface NotaFiscal {
  id: string;
  numero: string;
  tipo: "servico" | "fornecedor";
  fornecedor: string;
  valor: number;
  setor: string;
  dataEmissao: string;
  dataVencimento: string;
  status: "pendente" | "paga" | "vencida";
  descricao?: string;
}

export const SETORES = [
  "Administrativo",
  "Manutenção",
  "Cozinha",
  "GOV.",
  "A&B",
  "Serviços Gerais",
  "Nao identificado"
] as const;

export type Setor = (typeof SETORES)[number];
