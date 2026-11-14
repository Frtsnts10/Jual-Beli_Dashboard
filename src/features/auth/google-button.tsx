"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { authErrorMessage, startSession } from "./start-session";

export function GoogleButton({ next, disabled, onError }: { next?: string; disabled?: boolean; onError: (m: string) => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled}
      onClick={async () => {
        try {
          const cred = await signInWithPopup(auth, new GoogleAuthProvider());
          await startSession(cred, undefined, next);
        } catch (err) {
          onError(authErrorMessage(err));
        }
      }}
    >
      Lanjut dengan Google
    </Button>
  );
}
