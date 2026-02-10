'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';

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
          <a href="#" className="navbar-logo"><span>4TK</span> HOSPITALITY</a>
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
              <a href="https://rms.pakhos.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">💹 {t.hero.cta1}</a>
              <a onClick={() => scrollTo('lead-form')} className="btn btn-outline" style={{ cursor: 'pointer' }}>📞 {t.hero.cta2}</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="hero-stat-value">{t.hero.stat1}</div><div className="hero-stat-label">{t.hero.stat1Label}</div></div>
              <div className="hero-stat"><div className="hero-stat-value">{t.hero.stat2}</div><div className="hero-stat-label">{t.hero.stat2Label}</div></div>
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
          <div className="steps-grid">
            {t.howItWorks.steps.map((step, i) => (
              <div className="step-card fade-in" key={i}>
                <div className="step-number">{step.number}</div>
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
                <div className="pillar-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
          <div className="transparency-box fade-in">
            <h4>🔍 {t.model.transparency.title}</h4>
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
            <h4>📣 {t.model.mediaCost.title}</h4>
            <p>{t.model.mediaCost.line1}</p>
            <p style={{ marginTop: 6 }}>{t.model.mediaCost.line2}</p>
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
                <div className="tech-icon">{item.icon}</div>
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
                  <span className="case-location">📍 {c.location}</span>
                  <span className="case-timeline">⏱ {c.timeline}</span>
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
                  <span className="faq-chevron">▼</span>
                </button>
                <div className={`faq-a ${openFaq === i ? 'open' : ''}`}>
                  {item.a}
                </div>
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
                  <div className="lead-contact-icon">💬</div>
                  <a className="lead-contact-text" href="https://zalo.me/0778602953" target="_blank" rel="noopener noreferrer">Zalo: {t.contact.zalo}</a>
                </div>
                <div className="lead-contact-item">
                  <div className="lead-contact-icon">📧</div>
                  <a className="lead-contact-text" href={`mailto:${t.contact.email}`}>{t.contact.email}</a>
                </div>
                <div className="lead-contact-item">
                  <div className="lead-contact-icon">📍</div>
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
                {formStatus === 'sending' ? '⏳ ...' : `📞 ${t.leadForm.submit}`}
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
