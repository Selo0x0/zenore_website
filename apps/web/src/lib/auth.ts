import {
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { apiUrl } from "@/lib/api";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export async function syncCustomerProfile(user: User, displayName?: string) {
  const token = await user.getIdToken();
  const res = await fetch(`${apiUrl}/customers/me`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: displayName ?? user.displayName ?? undefined,
    }),
  });

  if (!res.ok) {
    throw new Error("profile-sync-failed");
  }
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncCustomerProfile(credential.user);
  return credential.user;
}
