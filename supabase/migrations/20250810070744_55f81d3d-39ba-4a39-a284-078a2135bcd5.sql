-- Create storage bucket for incident files
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-files', 'incident-files', false);

-- Create RLS policies for incident files
CREATE POLICY "Users can upload their own incident files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'incident-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own incident files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'incident-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own incident files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'incident-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own incident files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'incident-files' AND auth.uid()::text = (storage.foldername(name))[1]);