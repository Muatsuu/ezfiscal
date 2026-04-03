
-- Comments table for notas fiscais
CREATE TABLE public.nota_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.nota_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their notas
CREATE POLICY "Users can view comments on accessible notas"
ON public.nota_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.notas_fiscais nf
    WHERE nf.id = nota_id AND nf.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can insert comments
CREATE POLICY "Authenticated users can add comments"
ON public.nota_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON public.nota_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Recurrent notas config table
CREATE TABLE public.notas_recorrentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_base_id UUID NOT NULL,
  user_id UUID NOT NULL,
  empresa_id UUID,
  frequencia TEXT NOT NULL DEFAULT 'mensal',
  dia_vencimento INTEGER NOT NULL DEFAULT 1,
  ativa BOOLEAN NOT NULL DEFAULT true,
  ultima_geracao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recorrentes"
ON public.notas_recorrentes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
