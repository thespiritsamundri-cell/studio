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
    console.error("Firebase Storage Error:", error.code, error.message);
    if (error.serverResponse) {
        console.error("Raw server response:", error.serverResponse);
    }
    // Re-throw the original error to be handled by the caller
    throw error;
  }
}
