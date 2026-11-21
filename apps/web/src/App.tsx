import { useState } from 'react';
import { PRODUCT_NAME } from '@buzzqr/shared';
import { translate, type Locale } from './i18n';
import { BankAccountPage } from './pages/BankAccountPage';

export function App() {
  const [locale, setLocale] = useState<Locale>('es-MX');
  const path = window.location.pathname;

  if (path === '/app/bank-account') {
    return <BankAccountPage locale={locale} onLocale={setLocale} />;
  }

  return (
    <main className="page">
      <h1>{PRODUCT_NAME}</h1>
      <p>
        <a href="/app/bank-account">{translate(locale, 'bankAccount.open')}</a>
      </p>
    </main>
  );
}
