"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-muted-foreground">Use Google to continue.</p>
      </div>
      <div>
        <Button
          className="w-full"
          onClick={() => signIn.social({ provider: "google" })}
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
