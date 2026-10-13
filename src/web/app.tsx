import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import useSWR from "swr";
import { ApiClientError, swrFetcher } from "@/web/api";
import { AppShell } from "@/web/components/app-shell";
import { Loading } from "@/web/components/ui/loading";
import { syncVisoraUser } from "@/web/lib/visora";
import { CheckoutPage } from "@/web/pages/checkout";
import { DashboardPage } from "@/web/pages/dashboard";
import { DocsPage } from "@/web/pages/docs";
import { KeyCenterPage } from "@/web/pages/keys";
import { LoginPage } from "@/web/pages/login";
import { OrderDetailPage } from "@/web/pages/order-detail";
import { OrdersPage } from "@/web/pages/orders";
import { SettingsPage } from "@/web/pages/settings";
import { SetupPage } from "@/web/pages/setup";
import { SystemPage } from "@/web/pages/system";

type AdminMe = { user: { id: string; username: string } };

async function fetchAdminMe() {
  try {
    return await swrFetcher<AdminMe>("/admin-api/me");
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null;
    throw error;
  }
}

function useAdminMe() {
  return useSWR<AdminMe | null>("/admin-api/me", fetchAdminMe, { shouldRetryOnError: false });
}

function useVisoraAdminIdentity() {
  const { data, isLoading } = useAdminMe();
  useEffect(() => {
    if (isLoading) return;
    const user = data?.user;
    if (!user) {
      syncVisoraUser(null);
      return;
    }
    syncVisoraUser({ id: user.id || user.username, name: user.username });
  }, [data, isLoading]);
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useAdminMe();
  if (isLoading) return <Loading label="正在验证会话" />;
  if (error || !data?.user) return <Navigate to="/login" replace />;
  return children;
}

function LoginRoute() {
  const { data } = useAdminMe();
  if (data?.user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

function Home() {
  const { data, isLoading } = useSWR<{ setup_completed: boolean }>("/admin-api/setup/status", swrFetcher);
  if (isLoading) return <Loading />;
  return <Navigate to={data?.setup_completed ? "/dashboard" : "/setup"} replace />;
}

export function App() {
  useVisoraAdminIdentity();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/checkout/:token" element={<CheckoutPage />} />
      <Route element={<RequireAdmin><AppShell /></RequireAdmin>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/keys" element={<KeyCenterPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/system" element={<SystemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
