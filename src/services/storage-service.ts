
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored (e.g., 'images/logos').
 * @returns The public download URL of the uploaded file.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const storageRef = ref(storage, `${path}/${file.name}_${Date.now()}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload file to Firebase Storage.');
  }
}
