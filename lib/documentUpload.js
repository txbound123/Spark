import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return "That file is a bit too large for me right now (max 5MB). Could you share a smaller version?";
  }
  const name = file.name.toLowerCase();
  const allowed = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
  if (!allowed) {
    return "I can read PDF, Word, and text files. Could you share one of those?";
  }
  return null;
}

export async function extractText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (name.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/build/pdf.worker.min.mjs';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return text.trim();
  }

  if (name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error('Unsupported file type');
}

export async function uploadDocument(file, userId) {
  const timestamp = Date.now();
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = userId + '/' + timestamp + '-' + sanitized;

  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type });

  if (error) throw error;
  return storagePath;
}

export async function saveDocumentMetadata(userId, filename, storagePath, fileType, fileSize, extractedText) {
  const { error } = await supabase.from('user_documents').insert({
    user_id: userId,
    filename,
    storage_path: storagePath,
    file_type: fileType,
    file_size: fileSize,
    extracted_text: extractedText,
  });
  if (error) throw error;
}
