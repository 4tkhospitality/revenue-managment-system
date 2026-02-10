'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#" className="navbar-logo">
            <span>4TK</span> HOSPITALITY
          </a>

          <ul className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            <li><a onClick={() => scrollTo('services')}>{t.nav.services}</a></li>
            <li><a onClick={() => scrollTo('technology')}>{t.nav.technology}</a></li>
            <li><a onClick={() => scrollTo('results')}>{t.nav.results}</a></li>
            <li><a onClick={() => scrollTo('team')}>{t.nav.team}</a></li>
            <li>
              <div className="lang-toggle">
                <button className={lang === 'vi' ? 'active' : ''} onClick={() => setLang('vi')}>VN</button>
                <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              </div>
            </li>
            <li><a className="nav-cta" onClick={() => scrollTo('contact')}>{t.nav.cta}</a></li>
          </ul>

          <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🏨 Hotel & Resort Management — Vietnam & Indonesia</div>
            <h1>
              {t.hero.tagline}<br />
              <span>{t.hero.taglineSub}</span>
            </h1>
            <p>{t.hero.description}</p>
            <div className="hero-ctas">
              <a href="https://zalo.me/0778602953" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                📞 {t.hero.cta1}
              </a>
              <a href="https://rms.pakhos.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                💹 {t.hero.cta2}
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">{t.hero.stat1}</div>
                <div className="hero-stat-label">{t.hero.stat1Label}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{t.hero.stat2}</div>
                <div className="hero-stat-label">{t.hero.stat2Label}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{t.hero.stat3}</div>
                <div className="hero-stat-label">{t.hero.stat3Label}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════ */}
      <section className="section services" id="services">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.services.title}</h2>
            <p className="section-subtitle">{t.about.description}</p>
          </div>
          <div className="services-grid">
            {/* Sales Outsourcing */}
            <div className="service-card fade-in">
              <h3>📊 {t.services.sales.title}</h3>
              {t.services.sales.items.map((item, i) => (
                <div className="service-item" key={i}>
                  <div className="service-item-icon">{item.icon}</div>
                  <div>
                    <div className="service-item-text">{item.text}</div>
                    <div className="service-item-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Marketing Outsourcing */}
            <div className="service-card fade-in">
              <h3>📣 {t.services.marketing.title}</h3>
              {t.services.marketing.items.map((item, i) => (
                <div className="service-item" key={i}>
                  <div className="service-item-icon">{item.icon}</div>
                  <div>
                    <div className="service-item-text">{item.text}</div>
                    <div className="service-item-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY OUTSOURCE ═══════════ */}
      <section className="section why-outsource" id="why-outsource">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.whyOutsource.title}</h2>
          </div>
          <div className="why-grid">
            {t.whyOutsource.items.map((item, i) => (
              <div className="why-card fade-in" key={i}>
                <div className="why-card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TECHNOLOGY ═══════════ */}
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
                <div className="tech-description">{item.description}</div>
                <span className="tech-metric">{item.metric}</span>
                {item.highlight && (
                  <div>
                    <a href="https://rms.pakhos.com" target="_blank" rel="noopener noreferrer" className="tech-cta">
                      {t.hero.cta2} →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ RESULTS ═══════════ */}
      <section className="results" id="results">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.results.title}</h2>
          </div>
          <div className="results-grid">
            {t.results.items.map((item, i) => (
              <div className="result-item fade-in" key={i}>
                <div className="result-value">{item.value}</div>
                <div className="result-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CASE STUDIES ═══════════ */}
      <section className="section case-studies" id="case-studies">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.caseStudies.title}</h2>
          </div>
          <div className="case-grid">
            {t.caseStudies.cases.map((c, i) => (
              <div className="case-card fade-in" key={i}>
                <span className="case-location">📍 {c.location}</span>
                <h3 className="case-name">{c.name}</h3>
                <p className="case-challenge">{c.challenge}</p>
                <ul className="case-results">
                  {c.results.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CLIENTS ═══════════ */}
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
                <ul>
                  {region.hotels.map((hotel, j) => (
                    <li key={j}>{hotel}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM ═══════════ */}
      <section className="section team" id="team">
        <div className="container">
          <div className="text-center fade-in">
            <h2 className="section-title">{t.team.title}</h2>
          </div>
          <div className="team-grid">
            {t.team.members.map((member, i) => (
              <div className="team-card fade-in" key={i}>
                <div className="team-avatar">{member.name.charAt(0)}</div>
                <div className="team-name">{member.name}</div>
                <div className="team-role">{member.role}</div>
                {member.subtitle && <div className="team-subtitle">{member.subtitle}</div>}
                <div className="team-bio">{member.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section className="section contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="fade-in">
              <h2 className="section-title">{t.contact.title}</h2>
              <p className="section-subtitle" style={{ margin: '0 0 32px' }}>{t.contact.subtitle}</p>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">💬</div>
                  <div>
                    <div className="contact-label">Zalo</div>
                    <a className="contact-value" href="https://zalo.me/0778602953" target="_blank" rel="noopener noreferrer">
                      0778 602 953
                    </a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div>
                    <div className="contact-label">{t.contact.email}</div>
                    <a className="contact-value" href="mailto:contact@pakhos.com">
                      contact@pakhos.com
                    </a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div>
                    <div className="contact-label">{t.contact.addressLabel}</div>
                    <div className="contact-value">{t.contact.address}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-cta-area fade-in">
              <h3>{t.contact.title}</h3>
              <p>{t.contact.subtitle}</p>
              <a href="https://zalo.me/0778602953" target="_blank" rel="noopener noreferrer" className="btn btn-white">
                💬 {t.contact.zalo}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
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
