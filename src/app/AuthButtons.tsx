"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <div style={{ margin: "1rem 0" }}>
        <span>Signed in as {session.user?.email || session.user?.name}</span>
        <button style={{ marginLeft: 8 }} onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }
  return (
    <button style={{ margin: "1rem 0" }} onClick={() => signIn("entra-oidc")}>Sign in with Microsoft Entra ID</button>
  );
}
