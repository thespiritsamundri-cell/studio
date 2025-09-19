
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/lib/types";

export async function fetchNotifications(user: User | null) {
  // agar user super_admin nahi hai to khali list bhej do
  if (!user || user.role !== "super_admin") {
    return [];
  }

  const snapshot = await getDocs(collection(db, "notifications"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
