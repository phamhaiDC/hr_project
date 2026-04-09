'use client';

import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import i18n from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>{children}</AuthProvider>
    </I18nextProvider>
  );
}
