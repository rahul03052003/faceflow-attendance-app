
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthGuard } from '@/components/auth-guard';

export const metadata: Metadata = {
  title:
    'AI-Based Smart Attendance System Using Face Recognition with Emotion Detection, Cloud Synchronization, and Voice Interaction',
  description:
    'An AI-powered smart attendance system featuring face recognition, emotion detection, cloud synchronization, and voice interaction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <FirebaseErrorListener>
              <AuthGuard>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <SidebarInset className="flex min-h-0 flex-1 flex-col !p-0">
                        <AppHeader />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                          {children}
                        </main>
                      </SidebarInset>
                    </div>
                  </SidebarProvider>
                  <Toaster />
              </AuthGuard>
            </FirebaseErrorListener>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
