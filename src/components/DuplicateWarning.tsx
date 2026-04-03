import { AlertTriangle } from "lucide-react";
import { NotaFiscal } from "@/types/notaFiscal";

interface DuplicateWarningProps {
  numero: string;
  fornecedor: string;
  notas: NotaFiscal[];
  excludeId?: string;
}

const DuplicateWarning = ({ numero, fornecedor, notas, excludeId }: DuplicateWarningProps) => {
  if (!numero || !fornecedor) return null;

  const duplicates = notas.filter(
    (n) =>
      n.numero.toLowerCase() === numero.toLowerCase() &&
      n.fornecedor.toLowerCase() === fornecedor.toLowerCase() &&
      n.id !== excludeId
  );

  if (duplicates.length === 0) return null;

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/20 animate-fade-in">
      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-warning">Possível duplicidade detectada</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Já existe uma NF nº {numero} de {fornecedor}
          {duplicates[0].status === "paga" ? " (paga)" : duplicates[0].status === "vencida" ? " (vencida)" : " (pendente)"}
        </p>
      </div>
    </div>
  );
};

export default DuplicateWarning;
