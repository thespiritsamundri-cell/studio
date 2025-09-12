
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
    // Log the full error for server-side debugging.
    console.error("🔥 Firebase Storage error details:");
    console.error("code:", error.code);
    console.error("message:", error.message);

    // Attempt to parse the server response to get the real error message.
    if (error.serverResponse) {
        console.error("serverResponse:", error.serverResponse);
        try {
            const serverError = JSON.parse(error.serverResponse);
            if (serverError?.error?.message) {
                 // Throw the specific message from the server payload if it exists.
                 throw new Error(serverError.error.message);
            }
        } catch {
             // Non-JSON response, fall through to default error.
        }
    }
    // Re-throw a more informative error to be handled by the UI.
    // This will now be the specific Firebase error if available, otherwise the default one.
    throw new Error(error.message || `Upload failed. Check the browser console for detailed Firebase Storage error logs.`);
  }
}
