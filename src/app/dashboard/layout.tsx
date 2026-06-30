import Sidebar from "@/components/Sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Breadcrumb from "@/components/Breadcrumb";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar />
      <main className="ml-60 p-8">
        <Breadcrumb />
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <KeyboardShortcuts />
    </div>
  );
}
