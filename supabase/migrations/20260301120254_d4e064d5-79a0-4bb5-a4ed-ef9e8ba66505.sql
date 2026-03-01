-- Create storage bucket for invoice attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('nf-attachments', 'nf-attachments', false);

-- Add attachment_path column to notas_fiscais
ALTER TABLE public.notas_fiscais ADD COLUMN attachment_path text;

-- Storage policies: users can manage their own files (folder = user_id)
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nf-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'nf-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'nf-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nf-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);