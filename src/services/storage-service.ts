
'use server';

import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

export async function uploadFile(file: File, path: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("🔥 Firebase Storage error details:");
    console.error("code:", error.code);
    console.error("message:", error.message);

    if (error.serverResponse) {
        console.error("serverResponse:", error.serverResponse);
        try {
            // Attempt to parse JSON for a more readable error object
            const serverError = JSON.parse(error.serverResponse);
            if (serverError?.error?.message) {
                 throw new Error(`Upload failed: ${serverError.error.message}`);
            }
        } catch {
             // If it's not JSON, throw the raw response
            console.error("raw serverResponse:", error.serverResponse);
        }
    }
    // Re-throw a more informative error to be handled by the UI.
    throw new Error(error.message || `Upload failed. Check the browser console for detailed Firebase Storage error logs.`);
  }
}
