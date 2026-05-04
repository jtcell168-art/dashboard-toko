import { createClient } from "./client";

/**
 * Upload file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - Bucket name (default: 'proofs')
 * @returns {Promise<string|null>} - Public URL of the uploaded file
 */
export async function uploadFile(file, bucket = 'proofs') {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}
