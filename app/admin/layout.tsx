import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!isAdminSessionValid(session)) redirect("/");
  return children;
}
