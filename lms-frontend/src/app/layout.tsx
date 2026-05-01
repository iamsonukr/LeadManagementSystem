import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/layout/ReduxProvider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'LMS — Lead Management System',
  description: 'CRM + Lead + Call + Revenue Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
