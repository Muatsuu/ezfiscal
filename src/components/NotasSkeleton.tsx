import { Skeleton } from "@/components/ui/skeleton";

export const NotasListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card rounded-2xl p-5 space-y-3 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export const NotasTableSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/30">
            {["Número", "Fornecedor", "Setor", "Valor", "Status", "Emissão", "Vencimento", "Ações"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border/10">
              <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 pt-2">
    <div>
      <Skeleton className="h-3 w-48 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 lg:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6">
        <Skeleton className="h-4 w-40 mb-5" />
        <Skeleton className="h-[260px] w-full rounded-xl" />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <Skeleton className="h-4 w-36 mb-5" />
        <Skeleton className="h-[190px] w-full rounded-full mx-auto max-w-[190px]" />
      </div>
    </div>
  </div>
);
