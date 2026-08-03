import type { Metadata } from "next";
import { getAdminEmail } from "@/lib/admin-auth";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Administración | Presta+",
  description: "Centro de control de tenants de Presta+.",
};

export default function AdminPage() {
  return <AdminDashboard adminEmail={getAdminEmail()} />;
}
