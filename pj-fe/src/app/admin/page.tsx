import { AdminConsolePage } from '@/components/admin/AdminConsolePage';
import { AdminLoginPage } from '@/components/admin/AdminLoginPage';
import { hasValidAdminSession } from '@/libs/admin-session';
export default async function AdminPage() {
  const isAuthenticated = await hasValidAdminSession();
  return isAuthenticated ? <AdminConsolePage /> : <AdminLoginPage />;
}
