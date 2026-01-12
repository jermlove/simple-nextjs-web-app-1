"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Sign in</h1>
      <button onClick={() => signIn("entra-oidc")}>Sign in with Microsoft Entra ID</button>
    </main>
  );
}
