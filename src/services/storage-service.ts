
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
            console.error("parsed:", JSON.parse(error.serverResponse));
        } catch {
            console.error("raw:", error.serverResponse); // In case response is not JSON
        }
    }
    // Re-throw the original error to be handled by the caller, which will show a toast message.
    throw error;
  }
}

