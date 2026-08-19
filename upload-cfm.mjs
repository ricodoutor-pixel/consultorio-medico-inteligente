import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadCFMPrint() {
  const userId = 'med-daniel-kobayashi';

  const filePath = "C:/Users/ricod/.gemini/antigravity/brain/e350a9cd-b25b-46dd-8621-5b48f5c34af6/.user_uploaded/media_1787170918380.png";
  const fileData = fs.readFileSync(filePath);

  const storagePath = userId + '/cfm_print.png';

  console.log('Fazendo upload para:', storagePath);
  const { error: uploadError } = await supabase.storage
    .from('doctor-kyc-documents')
    .upload(storagePath, fileData, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    return;
  }

  console.log('Upload concluído!');

  const { error: dbError } = await supabase
    .from('doctor_kyc_documents')
    .upsert({
      doctor_user_id: userId,
      document_kind: 'cfm_print',
      storage_path: storagePath,
      verification_status: 'pending'
    }, { onConflict: 'doctor_user_id,document_kind' });

  if (dbError) {
    console.error('Erro ao atualizar tabela:', dbError);
  } else {
    console.log('Tabela atualizada com sucesso!');
  }
}

uploadCFMPrint();
