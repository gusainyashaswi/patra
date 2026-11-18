import AppShell from "@/components/AppShell";
import AuthBoundary from "@/components/AuthBoundary";

export default function AppLayout({ children }) {
  return <AuthBoundary><AppShell>{children}</AppShell></AuthBoundary>;
}
