import RouteGuard from '@/components/layout/RouteGuard';
import Sidebar from '@/components/layout/Sidebar';
import AppHeader from '@/components/layout/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <Sidebar />
      <AppHeader />
      <main className="ml-0 mt-[60px] min-h-[calc(100vh-60px)] overflow-x-hidden bg-[#F8F9FC] md:ml-[220px]">
        {children}
      </main>
    </RouteGuard>
  );
}
