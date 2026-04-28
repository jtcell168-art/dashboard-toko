import MainLayout from "@/components/layout/MainLayout";
import { getCurrentUser } from "@/app/actions/auth";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  return <MainLayout user={user}>{children}</MainLayout>;
}
