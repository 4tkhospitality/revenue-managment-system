'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';

/* ── Inline SVG Icons (thin line, professional) ──────────── */
const Icons = {
  // Pillar icons
  noSalary: <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  revenue: <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  tools: <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
  hotel: <svg viewBox="0 0 24 24"><path d="M3 21V7l9-4 9 4v14" /><path d="M9 21V13h6v8" /><path d="M3 21h18" /></svg>,
  // Tech icons
  rms: <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" /></svg>,
  pms: <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  cms: <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
  cdp: <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  // Contact icons
  phone: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  mail: <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>,
  mapPin: <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  // Nav
  arrowRight: <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
};

const techIconMap = [Icons.rms, Icons.pms, Icons.cms, Icons.cdp];
const pillarIcons = [Icons.noSalary, Icons.revenue, Icons.tools, Icons.hotel];

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('sending');
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      hotelName: (form.elements.namedItem('hotelName') as HTMLInputElement).value,
      rooms: (form.elements.namedItem('rooms') as HTMLInputElement).value,
      occAdr: (form.elements.namedItem('occAdr') as HTMLInputElement).value,
      channels: selectedChannels,
      pms: (form.elements.namedItem('pms') as HTMLInputElement).value,
      needs: (form.elements.namedItem('needs') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { setFormStatus('success'); form.reset(); setSelectedChannels([]); }
      else setFormStatus('error');
    } catch { setFormStatus('error'); }
  };

  return (
    <>
      {/* ═══ NAVBAR ═══ */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#" className="navbar-logo">
            <svg className="navbar-logo-svg" viewBox="0 0 100 100" width="36" height="36">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              <text x="50" y="56" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="28">4TK</text>
            </svg>
            <span className="navbar-logo-text">4TK HOSPITALITY</span>
          </a>
          <ul className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            <li><a onClick={() => scrollTo('how-it-works')}>{t.nav.howItWorks}</a></li>
            <li><a onClick={() => scrollTo('model')}>{t.nav.model}</a></li>
            <li><a onClick={() => scrollTo('technology')}>{t.nav.technology}</a></li>
            <li><a onClick={() => scrollTo('results')}>{t.nav.results}</a></li>
            <li><a onClick={() => scrollTo('faq')}>{t.nav.faq}</a></li>
            <li>
              <div className="lang-toggle">
                <button className={lang === 'vi' ? 'active' : ''} onClick={() => setLang('vi')}>VN</button>
                <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              </div>
            </li>
            <li><a className="nav-cta" onClick={() => scrollTo('lead-form')}>{t.nav.cta}</a></li>
          </ul>
          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? '✕' : '☰'}</button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.hero.badge}</div>
            <h1>
              {t.hero.headline1}<br />
              <span className="highlight">{t.hero.headline2}</span>
            </h1>
            <p className="hero-desc">{t.hero.description}</p>
            <div className="hero-ctas">
              <a href="https://rms.pakhos.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">{t.hero.cta1} {Icons.arrowRight}</a>
              <a onClick={() => scrollTo('lead-form')} className="btn btn-outline" style={{ cursor: 'pointer' }}>{t.hero.cta2}</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="hero-stat-value">{t.hero.stat1}</div><div className="hero-stat-label">{t.hero.stat1Label}</div></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><div className="hero-stat-value">{t.hero.stat2}</div><div className="hero-stat-label">{t.hero.stat2Label}</div></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><div className="hero-stat-value">{t.hero.stat3}</div><div className="hero-stat-label">{t.hero.stat3Label}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.howItWorks.title}</h2>
            <p className="section-subtitle">{t.howItWorks.subtitle}</p>
          </div>
          <div className="steps-grid fade-in">
            {t.howItWorks.steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">Step {step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="step-tag">{step.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REVENUE SHARE MODEL ═══ */}
      <section className="section model-section" id="model">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.model.title}</h2>
            <p className="section-subtitle">{t.model.subtitle}</p>
          </div>
          <div className="pillars-grid fade-in">
            {t.model.pillars.map((p, i) => (
              <div className="pillar-card" key={i}>
                <div className="pillar-icon-wrap">{pillarIcons[i]}</div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
          <div className="transparency-box fade-in">
            <h4>{t.model.transparency.title}</h4>
            <div className="transparency-items">
              {t.model.transparency.items.map((item, i) => (
                <div className="transparency-item" key={i}>
                  <div className="t-label">{item.label}</div>
                  <div className="t-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="media-box fade-in">
            <h4>{t.model.mediaCost.title}</h4>
            <p>{t.model.mediaCost.line1}</p>
            <p style={{ marginTop: 4 }}>{t.model.mediaCost.line2}</p>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="section comparison" id="comparison">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.comparison.title}</h2>
          </div>
          <div className="fade-in" style={{ overflowX: 'auto' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  {t.comparison.headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.comparison.rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.label}</td>
                    <td>{row.inhouse}</td>
                    <td>{row.fourTK}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ TECHNOLOGY ═══ */}
      <section className="section technology" id="technology">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.technology.title}</h2>
            <p className="section-subtitle">{t.technology.subtitle}</p>
          </div>
          <div className="tech-grid">
            {t.technology.items.map((item, i) => (
              <div className={`tech-card fade-in ${item.highlight ? 'highlight' : ''}`} key={i}>
                <div className="tech-icon-wrap">{techIconMap[i]}</div>
                <div className="tech-name">{item.name}</div>
                <div className="tech-fullname">{item.fullName}</div>
                <div className="tech-desc">{item.description}</div>
                <span className="tech-metric">{item.metric}</span>
                {item.highlight && (
                  <div><a href="https://rms.pakhos.com" target="_blank" rel="noopener noreferrer" className="tech-cta">{t.hero.cta1} →</a></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RESULTS STRIP ═══ */}
      <section className="results" id="results">
        <div className="container">
          <div className="results-grid">
            {t.results.items.map((item, i) => (
              <div className="text-center fade-in" key={i}>
                <div className="result-value">{item.value}</div>
                <div className="result-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CASE STUDIES ═══ */}
      <section className="section case-studies" id="case-studies">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.caseStudies.title}</h2>
            <p className="section-subtitle">{t.caseStudies.subtitle}</p>
          </div>
          <div className="case-grid">
            {t.caseStudies.cases.map((c, i) => (
              <div className="case-card fade-in" key={i}>
                <div className="case-header">
                  <span className="case-location">{c.location}</span>
                  <span className="case-timeline">{c.timeline}</span>
                </div>
                <h3 className="case-name">{c.name}</h3>
                <p className="case-challenge">{c.challenge}</p>
                <div className="case-metrics">
                  {c.results.map((r, j) => (
                    <div className="case-metric" key={j}>
                      <span className="case-metric-label">{r.metric}</span>
                      <span className="case-metric-before">{r.before}</span>
                      <span className="case-metric-after">→ {r.after}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CLIENTS ═══ */}
      <section className="section clients" id="clients">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.clients.title}</h2>
          </div>
          <div className="testimonial fade-in">
            <blockquote>{t.clients.testimonial}</blockquote>
            <cite>— {t.clients.testimonialAuthor}</cite>
          </div>
          <div className="client-regions fade-in">
            {t.clients.regions.map((region, i) => (
              <div className="client-region" key={i}>
                <h4>{region.name}</h4>
                <ul>{region.hotels.map((hotel, j) => <li key={j}>{hotel}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section className="section team" id="team">
        <div className="container">
          <div className="text-center fade-in"><h2 className="section-title">{t.team.title}</h2></div>
          <div className="team-grid">
            {t.team.members.map((m, i) => (
              <div className="team-card fade-in" key={i}>
                <div className="team-avatar">{m.name.charAt(0)}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
                <div className="team-bio">{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="section faq-section" id="faq">
        <div className="container">
          <div className="text-center fade-in"><h2 className="section-title">{t.faq.title}</h2></div>
          <div className="faq-list fade-in">
            {t.faq.items.map((item, i) => (
              <div className="faq-item" key={i}>
                <button className={`faq-q ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className="faq-chevron">▾</span>
                </button>
                <div className={`faq-a ${openFaq === i ? 'open' : ''}`}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LEAD FORM ═══ */}
      <section className="section lead-section" id="lead-form">
        <div className="container">
          <div className="lead-grid">
            <div className="lead-info fade-in">
              <h2>{t.leadForm.title}</h2>
              <p>{t.leadForm.subtitle}</p>
              <div className="lead-contact">
                <div className="lead-contact-item">
                  <div className="lead-contact-icon">{Icons.phone}</div>
                  <a className="lead-contact-text" href="https://zalo.me/0778602953" target="_blank" rel="noopener noreferrer">Zalo: {t.contact.zalo}</a>
                </div>
                <div className="lead-contact-item">
                  <div className="lead-contact-icon">{Icons.mail}</div>
                  <a className="lead-contact-text" href={`mailto:${t.contact.email}`}>{t.contact.email}</a>
                </div>
                <div className="lead-contact-item">
                  <div className="lead-contact-icon">{Icons.mapPin}</div>
                  <span className="lead-contact-text">{t.contact.address}</span>
                </div>
              </div>
            </div>
            <form className="lead-form fade-in" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.name} *</label>
                  <input className="form-input" name="name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.email} *</label>
                  <input className="form-input" name="email" type="email" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.phone} *</label>
                  <input className="form-input" name="phone" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.hotelName} *</label>
                  <input className="form-input" name="hotelName" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.rooms} *</label>
                  <input className="form-input" name="rooms" type="number" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.occAdr}</label>
                  <input className="form-input" name="occAdr" placeholder="VD: OCC 60%, ADR 1.200.000" />
                </div>
              </div>
              <div className="form-row full">
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.channels}</label>
                  <div className="form-checkbox-group">
                    {t.leadForm.fields.channelOptions.map((ch, i) => (
                      <label className="form-checkbox-label" key={i}>
                        <input type="checkbox" checked={selectedChannels.includes(ch)} onChange={() => toggleChannel(ch)} />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.pms}</label>
                  <input className="form-input" name="pms" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.leadForm.fields.needs}</label>
                  <textarea className="form-textarea" name="needs" />
                </div>
              </div>
              <button className="btn-submit" type="submit" disabled={formStatus === 'sending'}>
                {formStatus === 'sending' ? '...' : t.leadForm.submit}
              </button>
              {formStatus === 'success' && <div className="form-msg success">{t.leadForm.success}</div>}
              {formStatus === 'error' && <div className="form-msg error">{t.leadForm.error}</div>}
            </form>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <span>{t.footer.copyright}</span>
            <span>{t.footer.tagline}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
