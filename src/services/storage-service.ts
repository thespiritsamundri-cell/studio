
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFile(file: File, path: string): Promise<string> {
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
            console.error("parsed serverResponse:", JSON.parse(error.serverResponse));
        } catch {
             // If it's not JSON, log the raw response
            console.error("raw serverResponse:", error.serverResponse);
        }
    }
    // Re-throw a more informative error to be handled by the UI, which will show a toast.
    throw new Error(`Upload failed. Check the browser console for detailed Firebase Storage error logs.`);
  }
}
