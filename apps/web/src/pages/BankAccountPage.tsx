import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  bankAccountInputSchema,
  isValidClabe,
  type BankAccountErrorCode,
  type BankAccountView,
} from '@buzzqr/shared';
import { translate, type Locale, type MessageKey } from '../i18n';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; view: BankAccountView }
  | { phase: 'error'; code: BankAccountErrorCode };

function Icon({ kind }: { kind: 'error' | 'pending' | 'active' }) {
  if (kind === 'error') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'pending') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12.5l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Notice({ kind, children }: { kind: 'error' | 'pending' | 'active'; children: ReactNode }) {
  return (
    <p className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon kind={kind} />
      <span>{children}</span>
    </p>
  );
}

export function BankAccountPage({
  locale,
  onLocale,
}: {
  locale: Locale;
  onLocale: (locale: Locale) => void;
}) {
  const t = (key: MessageKey) => translate(locale, key);
  const [alias, setAlias] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderType, setHolderType] = useState<'person' | 'company'>('person');
  const [clabe, setClabe] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<BankAccountErrorCode | null>(null);
  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });

  function applyView(view: BankAccountView) {
    setLoad({ phase: 'ready', view });
    setErrorCode(null);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/bank-account')
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setLoad({ phase: 'error', code: readErrorCode(payload) });
          return;
        }
        if (isView(payload)) applyView(payload);
      })
      .catch(() => {
        if (!cancelled) setLoad({ phase: 'error', code: 'pey_unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedClabe = clabe.trim();
    const input = { alias, holderName, holderType, clabe: trimmedClabe };
    if (!bankAccountInputSchema.safeParse(input).success) {
      const code = isValidClabe(trimmedClabe) ? 'invalid_input' : 'invalid_clabe';
      setErrorCode(code);
      return;
    }
    if (!isValidClabe(trimmedClabe)) {
      setErrorCode('invalid_clabe');
      return;
    }

    setSubmitting(true);
    setErrorCode(null);
    try {
      const response = await fetch('/api/bank-account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErrorCode(readErrorCode(payload));
        return;
      }
      if (isView(payload)) applyView(payload);
    } catch {
      setErrorCode('pey_unavailable');
    } finally {
      setSubmitting(false);
    }
  }

  const registered =
    load.phase === 'ready' && (load.view.status === 'pending' || load.view.status === 'active');

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('bankAccount.title')}</h1>
        <button
          type="button"
          aria-pressed="false"
          onClick={() => onLocale(locale === 'es-MX' ? 'en' : 'es-MX')}
        >
          {t('bankAccount.language')}
        </button>
      </header>

      {load.phase === 'loading' ? <p role="status">{t('bankAccount.loading')}</p> : null}
      {load.phase === 'error' ? (
        <Notice kind="error">{t(`bankAccount.${load.code}`)}</Notice>
      ) : null}

      {registered && load.phase === 'ready' ? (
        <section className="stack">
          <p>
            {t('bankAccount.alias')}: {load.view.alias}
          </p>
          <p>
            {t('bankAccount.holderName')}: {load.view.holderName}
          </p>
          <p>
            {t('bankAccount.holderType')}:{' '}
            {load.view.holderType === 'company'
              ? t('bankAccount.company')
              : t('bankAccount.person')}
          </p>
          <p className="masked">
            {t('bankAccount.masked')} {load.view.clabeLast4}
          </p>
          <Notice kind={load.view.status === 'active' ? 'active' : 'pending'}>
            {load.view.status === 'active' ? t('bankAccount.active') : t('bankAccount.pending')}
          </Notice>
        </section>
      ) : null}

      {load.phase === 'ready' && !registered ? (
        <form className="stack" onSubmit={onSubmit} noValidate>
          {errorCode ? <Notice kind="error">{t(`bankAccount.${errorCode}`)}</Notice> : null}
          <label className="stack" htmlFor="bank-alias">
            {t('bankAccount.alias')}
            <input
              id="bank-alias"
              name="alias"
              type="text"
              autoComplete="organization"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              required
            />
          </label>
          <label className="stack" htmlFor="bank-holder">
            {t('bankAccount.holderName')}
            <input
              id="bank-holder"
              name="holderName"
              type="text"
              autoComplete="name"
              value={holderName}
              onChange={(event) => setHolderName(event.target.value)}
              required
            />
          </label>
          <fieldset>
            <legend>{t('bankAccount.holderType')}</legend>
            <label className="choice">
              <input
                type="radio"
                name="holderType"
                value="person"
                checked={holderType === 'person'}
                onChange={() => setHolderType('person')}
              />
              {t('bankAccount.person')}
            </label>
            <label className="choice">
              <input
                type="radio"
                name="holderType"
                value="company"
                checked={holderType === 'company'}
                onChange={() => setHolderType('company')}
              />
              {t('bankAccount.company')}
            </label>
          </fieldset>
          <label className="stack" htmlFor="bank-clabe">
            {t('bankAccount.clabe')}
            <input
              id="bank-clabe"
              name="clabe"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={clabe}
              onChange={(event) => setClabe(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {t('bankAccount.submit')}
          </button>
        </form>
      ) : null}
    </main>
  );
}

function readErrorCode(payload: unknown): BankAccountErrorCode {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'code' in payload.error &&
    typeof payload.error.code === 'string'
  ) {
    return payload.error.code as BankAccountErrorCode;
  }
  return 'pey_unknown';
}

function isView(payload: unknown): payload is BankAccountView {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    'clabeLast4' in payload &&
    !('clabe' in payload)
  );
}
