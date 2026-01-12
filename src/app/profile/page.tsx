import { getSession } from "../auth-utils";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <main style={{ padding: 32 }}>
      <h1>Profile</h1>
      <pre style={{ background: "#222", color: "#fff", padding: 16, borderRadius: 8 }}>
        {JSON.stringify(session.user, null, 2)}
      </pre>
      <p>This is a protected profile page showing Entra ID claims.</p>
    </main>
  );
}
