import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión | Presta+",
  description: "Acceso administrativo de Presta+.",
};

export default async function LoginPage() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (isAdminSessionValid(session)) redirect("/admin");
  return <LoginForm />;
}
