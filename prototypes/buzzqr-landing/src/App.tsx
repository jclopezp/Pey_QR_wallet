import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { PRODUCT_NAME, ROUTES, PEY_BRAND_ASSET } from './config';
import { es } from './i18n/es';
import { en } from './i18n/en';
type Lang = 'es' | 'en';
type Theme = 'light' | 'dark';
type IconName = 'arrow' | 'arrowRight' | 'check' | 'qr' | 'wallet' | 'bell' | 'history' | 'lock' | 'moon' | 'sun' | 'menu' | 'close' | 'bank' | 'phone' | 'shield' | 'credit' | 'play' | 'globe';
const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowRight: <><path d="m7 17 10-10M7 7h10v10" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM21 14v3M17 21h4v-2M14 20h1" /></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="3" /><path d="M3 10h18M7 6V4h10" /><path d="M16.5 15h2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  history: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h4" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  moon: <path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
  bank: <><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M2 21h20M12 3 2 9h20z" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  credit: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2c3 3 4 7 4 10s-1 7-4 10M12 2c-3 3-4 7-4 10s1 7 4 10" /></>,
};
function Icon({ name, size = 22, className = '' }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{iconPaths[name]}</svg>;
}
function LogoLockup() {
  return <span className="brand-lockup"><span className="logo-badge" aria-hidden="true"><Icon name="qr" size={24} /></span><Brand /></span>;
}
function Brand() {
  const main = PRODUCT_NAME.replace(/QR$/i, '');
  return <span className="wordmark" aria-label={PRODUCT_NAME}>{main}<span>{PRODUCT_NAME.slice(main.length)}</span></span>;
}
function readLang(): Lang {
  try {
    return localStorage.getItem('buzzqr_lang') === 'en' ? 'en' : 'es';
  }
  catch {
    return 'es';
  }
}
function readTheme(): Theme {
  try {
    const v = localStorage.getItem('buzzqr_theme');
    if (v === 'light' || v === 'dark')
      return v;
  }
  catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [route, setRoute] = useState(window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = lang === 'es' ? es : en;
  const isHome = route !== ROUTES.login && route !== ROUTES.signup && route !== ROUTES.app;
  useEffect(() => {
    document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
    document.title = `${PRODUCT_NAME} — ${t.metaTitle}`;
    try {
      localStorage.setItem('buzzqr_lang', lang);
    }
    catch { /* private browsing */ }
  }, [lang, t.metaTitle]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A1426' : '#F5F8FF');
    try {
      localStorage.setItem('buzzqr_theme', theme);
    }
    catch { /* private browsing */ }
  }, [theme]);
  useEffect(() => {
    const onPop = () => { setRoute(window.location.pathname); window.scrollTo({ top: 0 }); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => () => {
    if (timer.current)
      clearTimeout(timer.current);
  }, []);
  // Route changes are not in-page scrolls: reset after React has committed
  // the destination, not before it (which caused a visible desktop jump).
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [route]);
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const section = document.getElementById(id);
    if (!section)
      return;
    setMenuOpen(false);
    window.history.replaceState(null, '', `#${id}`);
    const anchor = section.querySelector('.section-kicker') || section.querySelector('h2') || section;
    const offset = window.innerWidth < 670 ? 26 : 54;
    const y = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to);
    setRoute(to);
    setMenuOpen(false);
    // Scroll restoration is handled after the new view mounts.
  }, []);
  const jump = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
    event.preventDefault(); if (to === route && to === ROUTES.home)
      window.scrollTo({ top: 0, behavior: 'instant' });
    else
      navigate(to);
  };
  const triggerToast = () => {
    if (timer.current)
      clearTimeout(timer.current);
    setShowToast(true);
    timer.current = setTimeout(() => setShowToast(false), 9000);
  };
  const pauseToast = () => {
    if (timer.current)
      clearTimeout(timer.current);
  };
  const resumeToast = () => {
    if (showToast) {
      if (timer.current)
        clearTimeout(timer.current);
      timer.current = setTimeout(() => setShowToast(false), 9000);
    }
  };
  return <>
    <a className="skip-link" href="#contenido">{t.skip}</a>
    <div className="site-wrap">
      <header className="site-header">
        <div className="container header-inner">
          <a className="logo-link" href={ROUTES.home} onClick={e => jump(e, ROUTES.home)}><LogoLockup /></a>
          <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`} aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}>
            {isHome && <>
              <a href="#como-funciona" onClick={e => scrollToSection(e, "como-funciona")}>{t.navHow}</a>
              <a href="#beneficios" onClick={e => scrollToSection(e, "beneficios")}>{t.navBenefits}</a>
              <a href="#confianza" onClick={e => scrollToSection(e, "confianza")}>{t.navTrust}</a>
              <a className="mobile-auth-link" href={ROUTES.login} onClick={e => jump(e, ROUTES.login)}>{t.navLogin}</a>
              <a className="mobile-auth-link" href={ROUTES.signup} onClick={e => jump(e, ROUTES.signup)}>{t.navStart}</a>
            </>}
          </nav>
          <div className="header-actions">
            <div className="locale-switch" role="group" aria-label={t.language}>
              <button className={lang === 'es' ? 'selected' : ''} type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
              <button className={lang === 'en' ? 'selected' : ''} type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            </div>
            <button className="theme-toggle" type="button" aria-label={theme === 'dark' ? t.themeLight : t.themeDark} title={theme === 'dark' ? t.themeLight : t.themeDark} onClick={() => setTheme(c => c === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={21} /></button>
            <a className="login-link" href={ROUTES.login} onClick={e => jump(e, ROUTES.login)}>{t.navLogin}</a>
            <a className="btn btn-primary nav-cta" href={ROUTES.signup} onClick={e => jump(e, ROUTES.signup)}>{t.navStart}<Icon name="arrow" size={18} /></a>
            {isHome && <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? t.closeMenu : t.menu} aria-expanded={menuOpen} onClick={() => setMenuOpen(c => !c)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>}
          </div>
        </div>
      </header>

      {isHome ? <main id="contenido">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-glow" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow hero-eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
              <h1 id="hero-title">{t.heroOne}<br />{t.heroTwo}<br /><span>{t.heroAccent}</span></h1>
              <p className="hero-sub">{t.heroDesc}</p>
              <div className="hero-buttons"><a className="btn btn-primary btn-large" href={ROUTES.signup} onClick={e => jump(e, ROUTES.signup)}>{t.navStart}<Icon name="arrow" /></a><a className="btn btn-outline btn-large" href="#como-funciona" onClick={e => scrollToSection(e, "como-funciona")}>{t.secondary}<Icon name="arrowRight" size={20} /></a></div>
              <div className="hero-features"><span><Icon name="check" size={18} />{t.noTerminal}</span><span><Icon name="check" size={18} />{t.ownAccount}</span><span><Icon name="check" size={18} />{t.clearHistory}</span></div>
              <p className="hero-legal">{t.legalDev}</p>
            </div>
            <div className="hero-visual">
              <div className="orbit orbit-a" /><div className="orbit orbit-b" />
              <div className="floating-side-label"><Icon name="qr" size={19} />{t.floatingNote}</div>
              <div className="phone-frame">
                <div className="phone-speaker" aria-hidden="true" />
                <div className="phone-top"><span>9:41</span><span className="signal-bars" aria-hidden="true">▂▄▆</span></div>
                <div className="phone-body">
                  <div className="wallet-heading"><span className="wallet-small-icon"><Icon name="wallet" size={18} /></span><div><strong>{t.phoneHeader}</strong><small>{t.phoneType}</small></div></div>
                  <div className="wallet-pass">
                    <div className="wallet-pass-top"><span className="pass-circle"><Icon name="credit" size={20} /></span><span className="pass-biz">{t.phoneBusiness}</span><span className="pass-demo-pill">DEMO</span></div>
                    <div className="pass-content"><span className="pass-label">{t.phoneBadge}</span><img className="demo-qr" src="/assets/qr-demo.svg" alt={lang === 'es' ? 'QR ilustrativo, no válido para recibir pagos' : 'Illustrative QR code, not valid for payments'} /><strong className="pass-cta">{t.phoneScan}</strong><small className="pass-foot">{t.phoneFoot}</small></div>
                  </div>
                  <div className="phone-mock-tag"><Icon name="wallet" size={15} />{t.phonePill}</div>
                </div>
              </div>
              <div className="sample-toast" aria-hidden="true"><span className="toast-check"><Icon name="check" size={20} /></span><span><small>{t.notifLabel}</small><strong>{t.notifSuccess}</strong><b>{t.notifAmount}</b></span></div>
              <div className="hero-visual-actions"><button type="button" className="demo-replay" onClick={triggerToast}><Icon name="play" size={15} />{t.replay}</button><span>{t.statusDemo}</span></div>
            </div>
          </div>
          <div className="hero-bottom-line" />
        </section>

        <section className="section steps-section" id="como-funciona" aria-labelledby="steps-title">
          <div className="container">
            <div className="centered-heading"><span className="section-kicker">{t.stepEyebrow}</span><h2 id="steps-title">{t.stepsTitle} <span>{t.stepsAccent}</span></h2><p>{t.stepsDesc}</p></div>
            <div className="steps-grid">
              <article className="step-card"><div className="step-icon"><Icon name="qr" size={26} /></div><span className="step-number">01</span><h3>{t.stepOneTitle}</h3><p>{t.stepOneText}</p></article>
              <article className="step-card"><div className="step-icon"><Icon name="wallet" size={26} /></div><span className="step-number">02</span><h3>{t.stepTwoTitle}</h3><p>{t.stepTwoText}</p></article>
              <article className="step-card"><div className="step-icon"><Icon name="bell" size={26} /></div><span className="step-number">03</span><h3>{t.stepThreeTitle}</h3><p>{t.stepThreeText}</p></article>
            </div>
          </div>
        </section>

        <section className="section benefits-section" id="beneficios" aria-labelledby="benefits-title">
          <div className="container benefits-layout">
            <div className="benefits-intro"><span className="section-kicker">{t.featuresEyebrow}</span><h2 id="benefits-title">{t.featuresTitle} <span>{t.featuresAccent}</span></h2><p>{t.featuresDesc}</p><div className="feature-note"><Icon name="wallet" size={21} /><span>{t.featureNote}</span></div></div>
            <div className="benefit-grid">
              <article className="benefit-card"><span className="benefit-icon"><Icon name="qr" size={25} /></span><h3>{t.feature1Title}</h3><p>{t.feature1Text}</p></article>
              <article className="benefit-card"><span className="benefit-icon"><Icon name="phone" size={25} /></span><h3>{t.feature2Title}</h3><p>{t.feature2Text}</p></article>
              <article className="benefit-card"><span className="benefit-icon"><Icon name="bell" size={25} /></span><h3>{t.feature3Title}</h3><p>{t.feature3Text}</p></article>
              <article className="benefit-card"><span className="benefit-icon"><Icon name="history" size={25} /></span><h3>{t.feature4Title}</h3><p>{t.feature4Text}</p></article>
            </div>
          </div>
        </section>

        <section className="section trust-section" id="confianza" aria-labelledby="trust-title">
          <div className="container trust-layout">
            <div className="trust-copy"><span className="section-kicker">{t.trustEyebrow}</span><h2 id="trust-title">{t.trustTitle}<br /><span>{t.trustAccent}</span></h2><p>{t.trustDesc}</p><div className="bank-note"><span className="bank-icon"><Icon name="bank" size={26} /></span><div><strong>{t.trustPanel}</strong><p>{t.trustDetail}</p></div></div></div>
            <div className="trust-diagram"><div className="diagram-top"><span className="diagram-brand"><LogoLockup /></span><span className="diagram-caption">CoDi + pey</span></div><ol className="flow-list"><li><span className="flow-icon"><Icon name="qr" /></span><p>{t.trustFlow1}</p></li><li><span className="flow-icon"><Icon name="phone" /></span><p>{t.trustFlow2}</p></li><li><span className="flow-icon"><Icon name="bank" /></span><p>{t.trustFlow3}</p></li><li><span className="flow-icon"><Icon name="bell" /></span><p>{t.trustFlow4}</p></li></ol><div className="powered-row"><span>{t.powered}</span><div className="logo-img-wrap">{!logoFailed ? <img src={PEY_BRAND_ASSET} onError={() => setLogoFailed(true)} alt={lang === 'es' ? 'Logotipos oficiales Pey y CoDi' : 'Official Pey and CoDi logos'} /> : <strong className="partner-text">CoDi · pey</strong>}</div></div><a className="partner-link" href="https://docs.pey.mx/brand-assets/" target="_blank" rel="noopener noreferrer">{t.logoLink}<Icon name="arrowRight" size={16} /></a></div>
          </div>
        </section>

        <section className="section final-section" aria-labelledby="final-title"><div className="container"><div className="final-cta"><span className="final-orbit" aria-hidden="true" /><div><span className="final-kicker">{t.finalKicker}</span><h2 id="final-title">{t.finalTitle}</h2><p>{t.finalText}</p></div><a className="btn btn-white btn-large" href={ROUTES.signup} onClick={e => jump(e, ROUTES.signup)}>{t.navStart}<Icon name="arrow" size={21} /></a></div></div></section>
      </main> : <main id="contenido" className="auth-route"><div className="auth-card"><a className="back-link" href={ROUTES.home} onClick={e => jump(e, ROUTES.home)}><Icon name="arrow" size={19} />{t.authBack}</a><div className="auth-mark"><Icon name={route === ROUTES.signup ? 'credit' : 'lock'} size={29} /></div><h1>{route === ROUTES.signup ? t.authSignupTitle : t.authLoginTitle} <Brand /></h1><p>{t.authIntro}</p><div className="auth-info"><Icon name="shield" size={25} /><span>{t.authNotice}</span></div><div className="auth-bottom"><span>{route === ROUTES.signup ? t.authAlready : t.authNew}</span><a href={route === ROUTES.signup ? ROUTES.login : ROUTES.signup} onClick={e => jump(e, route === ROUTES.signup ? ROUTES.login : ROUTES.signup)}>{route === ROUTES.signup ? t.authOpenLogin : t.authOpenSignup}<Icon name="arrow" size={17} /></a></div></div></main>}

      <footer className="footer"><div className="container footer-inner"><a className="footer-brand" href={ROUTES.home} onClick={e => jump(e, ROUTES.home)}><LogoLockup /></a><p>{t.footer}</p><div className="footer-partner"><span className="footer-partner-label">{t.footerPartnerLabel}</span><a className="footer-partner-asset" href="https://docs.pey.mx/brand-assets/" target="_blank" rel="noopener noreferrer" aria-label={lang === 'es' ? 'Ver recursos oficiales de marca Pey y CoDi' : 'View official Pey and CoDi brand assets'}>{!logoFailed ? <img src={PEY_BRAND_ASSET} loading="lazy" onError={() => setLogoFailed(true)} alt={lang === 'es' ? 'Logotipos oficiales de Pey y CoDi' : 'Official Pey and CoDi logos'} /> : <strong className="partner-text">pey + CoDi</strong>}</a></div><span className="footer-copy">© 2026 {PRODUCT_NAME}. {t.copyright}</span></div></footer>
    </div>
    {showToast && <div role="status" aria-live="polite" className="active-toast" onMouseEnter={pauseToast} onMouseLeave={resumeToast} onFocus={pauseToast} onBlur={resumeToast}><div className="toast-check"><Icon name="check" size={22} /></div><div><strong>{t.notifSuccess} · {t.notifAmount}</strong><span>{t.notifConcept}</span><small>{t.notifLabel}</small></div><button type="button" onClick={() => { setShowToast(false); pauseToast(); }} aria-label={lang === 'es' ? 'Cerrar aviso' : 'Close notification'}><Icon name="close" size={19} /></button></div>}
  </>;
}
