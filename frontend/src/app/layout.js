import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { SocketProvider } from '../context/SocketContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Rizora AI | Business Automation Platform',
  description: 'Enterprise-grade SaaS multi-business platform for automations and unified communications.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-slate-100 min-h-screen">
        <AuthProvider>
          <WorkspaceProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
