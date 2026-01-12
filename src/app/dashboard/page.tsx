import { getSession } from "../auth-utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <main style={{ padding: 32 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name || session.user?.email}!</p>
      <p>This is a protected dashboard view.</p>
    </main>
  );
}
