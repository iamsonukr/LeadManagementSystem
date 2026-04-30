import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/layout/ReduxProvider';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'LMS — Lead Management System',
  description: 'CRM + Client + Revenue + Call Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <Sidebar />
          <Header />
          <main className="ml-[220px] mt-[60px] min-h-[calc(100vh-60px)] bg-[#F8F9FC]">
            {children}
          </main>
        </ReduxProvider>
      </body>
    </html>
  );
}
