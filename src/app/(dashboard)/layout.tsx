import { redirect } from "next/navigation";
import DashboardClientLayout from "./client-layout";
import { validateSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await import("next/headers").then(m => m.cookies());
  const session = cookieStore.get("session")?.value;
  if (!(await validateSession(session))) redirect("/login");

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
