import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Google Fonts injected once ─────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  return null;
};

// ── ECG SVG path (realistic) ───────────────────────────────────────────────
const ECG_PATH = "M0,50 L60,50 L75,50 L80,10 L85,90 L90,50 L100,50 L115,50 L120,20 L125,80 L130,50 L200,50";

const EcgLine = () => {
  const pathRef = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 2200;
    const totalLength = 300;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = ((ts - start) % duration) / duration;
      setOffset(totalLength - progress * totalLength);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none"
      style={{ width: '100%', height: '80px', opacity: 0.7 }}>
      <defs>
        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="1" />
          <stop offset="100%" stopColor="#F0A500" stopOpacity="0.8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* background flat line */}
      <line x1="0" y1="50" x2="200" y2="50" stroke="#1E3A5F" strokeWidth="0.5" />
      {/* animated ECG */}
      <path ref={pathRef} d={ECG_PATH}
        fill="none" stroke="url(#ecgGrad)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="300" strokeDashoffset={offset}
        filter="url(#glow)" />
    </svg>
  );
};

// ── Stat counter ───────────────────────────────────────────────────────────
const Counter = ({ to, suffix = '', duration = 1800 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.floor(p * to));
        if (p < 1) requestAnimationFrame(step);
        else setVal(to);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ── Styles injected as a style tag ─────────────────────────────────────────
const Styles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy: #0A1628;
      --navy-mid: #0F2040;
      --navy-card: #132238;
      --sapphire: #2563EB;
      --sapphire-light: #60A5FA;
      --gold: #F0A500;
      --gold-dim: #A06E00;
      --slate: #CBD5E1; /* Plus clair que #94A3B8 pour un meilleur contraste */
      --slate-dark: #94A3B8;
      --white: #F8FAFC;
      --teal: #0D9488;
      --font-display: 'Plus Jakarta Sans', sans-serif;
    }
    html { scroll-behavior: smooth; }
    body { background: var(--navy); color: var(--white); font-family: 'Inter', sans-serif; overflow-x: hidden; line-height: 1.5; }

    /* ── Typography ── */
    .display { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; }
    .display-md { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; }

    /* ── Navbar ── */
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 72px;
      background: rgba(10,22,40,0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: var(--sapphire);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(37,99,235,0.4);
    }
    .logo-text { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: -0.02em; color: var(--white); }
    .nav-links { display: flex; gap: 40px; }
    .nav-links a { font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--slate); text-decoration: none; transition: color .2s; }
    .nav-links a:hover { color: var(--white); }
    .nav-actions { display: flex; gap: 16px; align-items: center; }
    .btn-ghost { padding: 10px 22px; border: 1px solid rgba(13,148,136,0.5); border-radius: 10px; color: var(--teal); font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: none; cursor: pointer; transition: all .2s; }
    .btn-ghost:hover { border-color: var(--teal); background: rgba(13,148,136,0.1); }
    .btn-primary { padding: 11px 24px; border-radius: 10px; background: var(--sapphire); color: white; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border: none; cursor: pointer; transition: all .2s; box-shadow: 0 0 20px rgba(37,99,235,0.25); }
    .btn-primary:hover { background: #1D4ED8; box-shadow: 0 0 30px rgba(37,99,235,0.4); transform: translateY(-1px); }

    /* ── Hero ── */
    .hero {
      min-height: 100vh; padding: 150px 48px 80px;
      display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 80px; align-items: center;
      max-width: 1280px; margin: 0 auto;
    }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.25);
      border-radius: 6px; padding: 6px 14px; margin-bottom: 28px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--sapphire-light);
    }
    .hero-title { font-size: clamp(44px, 5vw, 72px); color: var(--white); margin-bottom: 24px; }
    .hero-title .accent { color: var(--gold); }
    .hero-title .line2 { color: var(--sapphire-light); }
    .hero-sub { font-size: 17px; color: var(--slate); line-height: 1.7; max-width: 500px; margin-bottom: 40px; font-weight: 400; }
    .hero-cta { display: flex; gap: 16px; align-items: center; margin-bottom: 56px; }
    .btn-hero { padding: 18px 36px; border-radius: 14px; background: var(--sapphire); color: white; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: all .25s; box-shadow: 0 0 40px rgba(37,99,235,0.3); }
    .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(37,99,235,0.45); }
    .btn-hero-sec { padding: 18px 36px; border-radius: 14px; background: transparent; color: var(--teal); font-size: 14px; font-weight: 700; border: 1px solid rgba(13,148,136,0.5); cursor: pointer; transition: all .25s; }
    .btn-hero-sec:hover { background: rgba(13,148,136,0.1); }
    .ecg-container { margin-top: 8px; }
    .trust-row { display: flex; gap: 32px; align-items: center; }
    .trust-item { font-size: 12px; color: var(--slate-dark); font-weight: 600; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
    .trust-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sapphire-light); }

    /* ── Hero right panel ── */
    .hero-panel { position: relative; }
    .hero-img { width: 100%; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.5); aspect-ratio: 4/3; object-fit: cover; }
    .float-card {
      position: absolute; background: rgba(15,32,64,0.95); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 22px;
    }
    .float-card-ai { top: -24px; right: -24px; }
    .float-card-patient { bottom: -24px; left: -24px; }
    .card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-dark); margin-bottom: 4px; }
    .card-value { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--white); }
    .card-sub { font-size: 11px; color: var(--sapphire-light); font-weight: 600; margin-top: 2px; }
    .pulse { width: 10px; height: 10px; border-radius: 50%; background: #22C55E; animation: pulse 1.8s infinite; }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); } }

    /* ── Stats band ── */
    .stats-band { background: var(--navy-mid); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 48px 48px; }
    .stats-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
    .stat-item { text-align: center; padding: 0 24px; border-right: 1px solid rgba(255,255,255,0.06); }
    .stat-item:last-child { border-right: none; }
    .stat-number { font-family: var(--font-display); font-size: 46px; font-weight: 800; color: var(--white); letter-spacing: -0.01em; }
    .stat-number .gold { color: var(--gold); }
    .stat-label { font-size: 13px; color: var(--slate); font-weight: 500; letter-spacing: 0.02em; margin-top: 6px; }

    /* ── Patient band ── */
    .patient-band {
      background: linear-gradient(135deg, rgba(13,148,136,0.08) 0%, transparent 60%);
      border-top: 1px solid rgba(13,148,136,0.15);
      border-bottom: 1px solid rgba(13,148,136,0.15);
      padding: 36px 48px;
    }
    .patient-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
    .patient-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(13,148,136,0.12); border: 1px solid rgba(13,148,136,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .patient-text h3 { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--white); margin-bottom: 6px; }
    .patient-text p { font-size: 15px; color: var(--slate); }
    .btn-patient { padding: 16px 32px; border-radius: 12px; background: var(--teal); color: white; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; cursor: pointer; white-space: nowrap; transition: all .2s; }
    .btn-patient:hover { background: #0F766E; transform: translateY(-1px); }

    /* ── Section shared ── */
    .section { padding: 120px 48px; max-width: 1280px; margin: 0 auto; }
    .section-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sapphire-light); margin-bottom: 18px; }
    .section-title { font-size: clamp(34px, 3.5vw, 48px); color: var(--white); margin-bottom: 24px; }
    .section-sub { font-size: 17px; color: var(--slate); max-width: 600px; line-height: 1.7; }

    /* ── Security pillars ── */
    .security-bg { background: rgba(15,32,64,0.4); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 60px; }
    .pillar {
      padding: 54px 40px; background: var(--navy-card);
      transition: background .3s;
    }
    .pillar:first-child { border-radius: 20px 0 0 20px; }
    .pillar:last-child { border-radius: 0 20px 20px 0; }
    .pillar:hover { background: #172D4A; }
    .pillar-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 26px; font-size: 24px; }
    .pillar h3 { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--white); margin-bottom: 12px; }
    .pillar p { font-size: 15px; color: var(--slate); line-height: 1.7; }

    /* ── Services grid ── */
    .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 60px; }
    .service-card {
      background: var(--navy-card); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; padding: 40px; transition: all .3s; cursor: default;
      position: relative; overflow: hidden;
    }
    .service-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--sapphire), var(--gold));
      opacity: 0; transition: opacity .3s;
    }
    .service-card:hover { transform: translateY(-4px); border-color: rgba(37,99,235,0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .service-card:hover::before { opacity: 1; }
    .service-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; font-size: 24px; }
    .service-card h3 { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--white); margin-bottom: 12px; }
    .service-card p { font-size: 15px; color: var(--slate); line-height: 1.7; }

    /* ── AI Feature ── */
    .ai-section { background: var(--navy-mid); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .ai-inner { max-width: 1280px; margin: 0 auto; padding: 120px 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .ai-demo { background: var(--navy-card); border: 1px solid rgba(37,99,235,0.15); border-radius: 24px; padding: 36px; }
    .demo-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .demo-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--white); }
    .demo-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; background: rgba(37,99,235,0.15); color: var(--sapphire-light); padding: 4px 12px; border-radius: 20px; }
    .symptom-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .tag { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25); color: var(--sapphire-light); }
    .tag.gold { background: rgba(240,165,0,0.1); border-color: rgba(240,165,0,0.3); color: var(--gold); }
    .result-list { display: flex; flex-direction: column; gap: 12px; }
    .result-item { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 14px 18px; }
    .result-name { font-size: 14px; font-weight: 600; color: var(--white); }
    .result-bar-wrap { display: flex; align-items: center; gap: 14px; }
    .result-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); width: 130px; overflow: hidden; }
    .result-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
    .result-pct { font-size: 13px; font-weight: 700; color: var(--slate); min-width: 36px; text-align: right; }

    /* ── Parcours ── */
    .parcours-bg { background: var(--navy-card); border-top: 1px solid rgba(255,255,255,0.05); }
    .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 60px; position: relative; }
    .steps::before { content: ''; position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 1px; background: linear-gradient(90deg, var(--sapphire), var(--gold)); opacity: 0.3; }
    .step { padding: 0 24px; }
    .step-num { width: 56px; height: 56px; border-radius: 50%; background: var(--navy); border: 2px solid var(--sapphire); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--sapphire-light); margin-bottom: 24px; position: relative; z-index: 1; }
    .step h4 { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 10px; }
    .step p { font-size: 14px; color: var(--slate); line-height: 1.7; }

    /* ── CTA / Contact ── */
    .cta-section { padding: 120px 48px; max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
    .cta-contact { display: flex; flex-direction: column; gap: 24px; margin-top: 40px; }
    .contact-item { display: flex; align-items: center; gap: 20px; }
    .contact-icon { width: 54px; height: 54px; border-radius: 14px; background: var(--navy-card); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .contact-info .label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-dark); margin-bottom: 4px; }
    .contact-info .value { font-size: 18px; font-weight: 700; color: var(--white); }
    .form-card { background: var(--navy-card); border: 1px solid rgba(255,255,255,0.07); border-radius: 28px; padding: 40px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
    .form-label { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--slate); }
    .form-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 18px; color: var(--white); font-size: 15px; font-family: 'Inter', sans-serif; outline: none; transition: border-color .2s; }
    .form-input:focus { border-color: var(--sapphire); background: rgba(37,99,235,0.05); }
    .form-input::placeholder { color: var(--slate-dark); }
    textarea.form-input { resize: vertical; min-height: 120px; }
    .btn-submit { width: 100%; padding: 18px; border-radius: 14px; background: var(--sapphire); color: white; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; margin-top: 8px; transition: all .25s; box-shadow: 0 0 30px rgba(37,99,235,0.2); }
    .btn-submit:hover { background: #1D4ED8; box-shadow: 0 0 50px rgba(37,99,235,0.35); transform: translateY(-1px); }

    /* ── Footer ── */
    .footer { padding: 48px; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
    .footer-copy { font-size: 13px; color: var(--slate-dark); }
    .footer-links { display: flex; gap: 32px; }
    .footer-links a { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--slate-dark); text-decoration: none; transition: color .2s; }
    .footer-links a:hover { color: var(--sapphire-light); }

    /* ── Gold divider ── */
    .gold-line { height: 1px; background: linear-gradient(90deg, transparent, var(--gold-dim), transparent); margin: 0; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .hero, .ai-inner, .cta-section { grid-template-columns: 1fr; gap: 48px; }
      .services-grid, .pillars { grid-template-columns: 1fr 1fr; }
      .steps { grid-template-columns: 1fr 1fr; }
      .steps::before { display: none; }
      .stats-inner { grid-template-columns: repeat(2, 1fr); }
      .navbar { padding: 0 24px; }
      .nav-links { display: none; }
      .hero { padding: 120px 24px 60px; }
      .section { padding: 72px 24px; }
    }
    @media (max-width: 640px) {
      .services-grid, .pillars, .steps { grid-template-columns: 1fr; }
      .pillar:first-child, .pillar:last-child { border-radius: 20px; }
      .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
      .form-row { grid-template-columns: 1fr; }
      .patient-inner { flex-direction: column; text-align: center; }
      .cta-section { padding: 60px 24px; }
    }
  `}</style>
);

// ── SVG Icons (inline, no dep) ─────────────────────────────────────────────
const Icon = ({ d, size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const HeartIcon = ({ size = 24, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', specialty: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      return;
    }
    setFormSubmitted(true);
  };

  const services = [
    { icon: '🗂️', bg: 'rgba(37,99,235,0.12)', title: 'Dossier Patient 360°', desc: 'Accédez instantanément à l\'historique clinique complet : antécédents, allergies, constantes vitales et anciens traitements.' },
    { icon: '📅', bg: 'rgba(240,165,0,0.1)', title: 'Agenda Intelligent', desc: 'Planifiez vos rendez-vous en quelques clics, avec confirmations automatiques et rappels pour réduire le taux de no-show.' },
    { icon: '🤖', bg: 'rgba(139,92,246,0.12)', title: 'Aide au Diagnostic IA', desc: 'Suggérez les pathologies les plus probables en croisant 132 symptômes cliniques via notre assistant clinique intelligent.' },
    { icon: '📋', bg: 'rgba(13,148,136,0.12)', title: 'Prescription Instantanée', desc: 'Générez des ordonnances sécurisées et pré-remplies, prêtes à l\'impression ou au format numérique en moins de 5 secondes.' },
    { icon: '📹', bg: 'rgba(220,38,38,0.1)', title: 'Téléconsultation Sécurisée', desc: 'Consultez vos patients à distance via un flux vidéo crypté en peer-to-peer, directement intégré et sans installation requise.' },
    { icon: '📊', bg: 'rgba(6,182,212,0.1)', title: 'Pilotage d\'Activité', desc: 'Suivez en temps réel l\'évolution de votre patientèle, les pathologies fréquentes et la performance opérationnelle du cabinet.' },
  ];

  const pillars = [
    { icon: '🔐', bg: 'rgba(37,99,235,0.12)', color: '#3B82F6', title: 'Accès strict & Sécurisé', desc: 'Authentification forte par jetons à durée limitée. Accès compartimenté et droits spécifiques selon le rôle (Médecin, Secrétaire, Patient).' },
    { icon: '🛡️', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', title: 'Souveraineté des Données', desc: 'Hébergement hautement sécurisé au Maroc, garantissant une conformité totale avec la loi 09-08 et les directives de la CNDP.' },
    { icon: '💾', bg: 'rgba(13,148,136,0.12)', color: '#0D9488', title: 'Zéro Papier & Traçabilité', desc: 'Archivage numérique complet avec journal d\'audit inaltérable. Chaque prescription et action médicale est tracée et datée.' },
  ];

  const steps = [
    { n: '01', title: 'Prise en charge', desc: 'Le patient s\'inscrit en ligne ou est enregistré directement par la secrétaire à l\'accueil du cabinet.' },
    { n: '02', title: 'Planification', desc: 'Choix du créneau horaire, type de visite (présentielle ou vidéo) et envoi immédiat de confirmations.' },
    { n: '03', title: 'Diagnostic Assisté', desc: 'Saisie simplifiée des symptômes et analyse prédictive IA en temps réel pour appuyer la décision clinique.' },
    { n: '04', title: 'Clôture & Prescription', desc: 'Génération instantanée de l\'ordonnance PDF sécurisée et mise à jour immédiate du dossier patient.' },
  ];

  return (
    <>
      <FontLoader />
      <Styles />

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <HeartIcon size={18} color="white" />
          </div>
          <span className="logo-text">MedPredict</span>
        </div>
        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#ia">Intelligence</a>
          <a href="#securite">Sécurité</a>
          <a href="#parcours">Parcours</a>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/patient')}>Espace Patient</button>
          <button className="btn-primary" onClick={() => navigate('/connexion')}>Connexion Staff</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">
            <span style={{ fontSize: 14 }}>⚡</span> L'Intelligence Clinique au Service de Votre Cabinet
          </div>
          <h1 className="display hero-title">
            Propulsez votre<br />
            <span className="accent">cabinet</span><br />
            <span className="line2">dans l'ère de l'IA.</span>
          </h1>
          <p className="hero-sub">
            Centralisez vos dossiers patients, automatisez vos rendez-vous et sécurisez vos 
            décisions médicales grâce à un assistant clinique intelligent conçu pour le corps médical au Maroc.
          </p>
          <div className="hero-cta">
            <button className="btn-hero" onClick={() => navigate('/connexion')}>
              Découvrir l'Espace Staff →
            </button>
            <button className="btn-hero-sec" onClick={() => navigate('/patient')}>
              Accès Espace Patient
            </button>
          </div>
          <div className="ecg-container">
            <EcgLine />
          </div>
          <div className="trust-row" style={{ marginTop: 16 }}>
            <span className="trust-item"><span className="trust-dot"></span>Chiffrement Fort</span>
            <span className="trust-item"><span className="trust-dot"></span>Conforme CNDP (Loi 09-08)</span>
            <span className="trust-item"><span className="trust-dot"></span>Hébergement Local</span>
          </div>
        </div>

        <div className="hero-panel">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=900"
            alt="MedPredict Dashboard"
            className="hero-img"
          />
          <div className="float-card float-card-ai">
            <div className="card-label">Fiabilité du Modèle</div>
            <div className="card-value" style={{ color: '#60A5FA' }}>94<span style={{ fontSize: 18, color: '#F0A500' }}>.2%</span></div>
            <div className="card-sub">Assistant clinique · 132 symptômes</div>
          </div>
          <div className="float-card float-card-patient">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="pulse"></div>
              <div>
                <div className="card-label">Cabinet Actif</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Dr. A. Benali</div>
                <div className="card-sub">3 consultations finalisées aujourd'hui</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="stats-inner">
          {[
            { val: 94, suffix: '%', label: 'Précision diagnostique', gold: true },
            { val: 132, suffix: '', label: 'Symptômes cliniques modélisés' },
            { val: 5, suffix: 's', label: 'Génération d\'ordonnance' },
            { val: 4, suffix: '', label: 'Profils d\'utilisateurs sécurisés' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-number">
                <Counter to={s.val} suffix={s.suffix} />
                {s.gold && <span className="gold">+</span>}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PATIENT BAND */}
      <div className="patient-band">
        <div className="patient-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="patient-icon">
              <HeartIcon size={28} color="#0D9488" />
            </div>
            <div className="patient-text">
              <h3>Simplifiez le parcours de vos patients</h3>
              <p>Offrez-leur la prise de rendez-vous en ligne 24h/7j et un accès sécurisé à leur historique médical.</p>
            </div>
          </div>
          <button className="btn-patient" onClick={() => navigate('/patient')}>
            Accéder à mon espace patient →
          </button>
        </div>
      </div>

      <div className="gold-line" />

      {/* SECURITY */}
      <div className="security-bg">
        <div className="section" id="securite">
          <div className="section-eyebrow">Sécurité & Confidentialité</div>
          <h2 className="display-md section-title">Sécurité absolue.<br />Conformité totale.</h2>
          <p className="section-sub">La protection des données médicales est notre priorité absolue. MedPredict intègre les meilleurs standards de sécurité pour préserver le secret médical.</p>
          <div className="pillars">
            {pillars.map((p, i) => (
              <div key={i} className="pillar">
                <div className="pillar-icon" style={{ background: p.bg }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="section" id="services">
        <div className="section-eyebrow">Modules Intégrés</div>
        <h2 className="display-md section-title">Une plateforme unique<br />pour tout gérer.</h2>
        <p className="section-sub">Du premier contact patient à la génération d'ordonnance, optimisez chaque étape de votre pratique quotidienne.</p>
        <div className="services-grid">
          {services.map((s, i) => (
            <div key={i} className="service-card">
              <div className="service-icon" style={{ background: s.bg }}>
                <span>{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI FEATURE */}
      <div className="ai-section" id="ia">
        <div className="ai-inner">
          <div>
            <div className="section-eyebrow">Aide à la Décision Clinique</div>
            <h2 className="display-md" style={{ fontSize: 'clamp(28px,3vw,44px)', color: 'white', lineHeight: 1.1, marginBottom: 20 }}>
              Un second avis éclairé.<br />En quelques secondes.
            </h2>
            <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Gagnez en sérénité lors de vos diagnostics. Notre assistant clinique intelligent
              analyse instantanément les symptômes saisis pour vous proposer un tri clinique et des probabilités
              de pathologies fiables — sans jamais remplacer votre jugement médical souverain.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Base de données de 132 symptômes cliniques', 'Algorithmes de classification et d\'aide à la décision', 'Génération instantanée de synthèses exportables', 'Sécurité : les données médicales restent strictement confidentielles'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#CBD5E1' }}>
                  <span style={{ color: '#22C55E', fontWeight: 700 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="ai-demo">
            <div className="demo-header">
              <div className="demo-title">Analyse Clinique IA</div>
              <span className="demo-badge">Moteur Actif</span>
            </div>
            <div className="symptom-tags">
              {['Fièvre', 'Toux sèche', 'Asthénie'].map(t => <span key={t} className="tag">{t}</span>)}
              <span className="tag gold">Douleurs thoraciques</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: 14 }}>Sujets de prédiction (Top 3)</div>
            <div className="result-list">
              {[
                { name: 'Pneumonie bactérienne', pct: 72, color: '#3B82F6' },
                { name: 'Bronchite aiguë', pct: 18, color: '#F0A500' },
                { name: 'Infection respiratoire virale', pct: 10, color: '#8B5CF6' },
              ].map((r, i) => (
                <div key={i} className="result-item">
                  <span className="result-name">{r.name}</span>
                  <div className="result-bar-wrap">
                    <div className="result-bar">
                      <div className="result-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                    <span className="result-pct" style={{ color: r.color }}>{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: 10, fontSize: 11, color: '#A06E00', lineHeight: 1.5 }}>
              ⚠️ Note : Les prédictions sont fournies à titre informatif et d'aide à la décision. Le diagnostic final relève de la responsabilité exclusive du praticien.
            </div>
          </div>
        </div>
      </div>

      {/* PARCOURS */}
      <div className="parcours-bg" id="parcours">
        <div className="section">
          <div className="section-eyebrow">Workflow Clinique</div>
          <h2 className="display-md section-title">Une consultation fluide<br />de bout en bout.</h2>
          <div className="steps">
            {steps.map((s, i) => (
              <div key={i} className="step">
                <div className="step-num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA + CONTACT */}
      <div className="cta-section" id="contact">
        <div>
          <div className="section-eyebrow">Démonstration & Contact</div>
          <h2 className="display-md" style={{ fontSize: 'clamp(32px,3.5vw,52px)', color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
            Prêt à moderniser<br />votre cabinet ?
          </h2>
          <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.7, maxWidth: 400 }}>
            Demandez une démonstration gratuite sur site ou à distance. Notre équipe vous accompagne partout au Maroc.
          </p>
          <div className="cta-contact">
            {[
              { icon: '💬', label: 'WhatsApp direct', value: '+212 6 61 00 00 00' },
              { icon: '✉️', label: 'Email support', value: 'contact@medpredict.ma' },
              { icon: '📍', label: 'Zone de couverture', value: 'National (Maroc)' },
            ].map((c, i) => (
              <div key={i} className="contact-item">
                <div className="contact-icon">{c.icon}</div>
                <div className="contact-info">
                  <div className="label">{c.label}</div>
                  <div className="value">
                    {c.label === 'Email support' ? (
                      <a href={`mailto:${c.value}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                        {c.value}
                      </a>
                    ) : c.label === 'WhatsApp direct' ? (
                      <a href={`https://wa.me/212661000000`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {formSubmitted ? (
          <div className="form-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 40px', minHeight: 400 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, color: '#0D9488' }}>✓</div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 12 }}>Demande reçue !</h3>
            <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.6, maxWidth: 360, marginBottom: 28 }}>
              Merci <strong>{formData.name}</strong>. Notre équipe a bien reçu votre demande pour la spécialité <em>{formData.specialty || 'Médecine'}</em>. Nous vous contacterons à l'adresse <strong>{formData.email}</strong> sous 24 heures pour planifier votre démo.
            </p>
            <button className="btn-ghost" onClick={() => { setFormSubmitted(false); setFormData({ name: '', specialty: '', email: '', message: '' }); }}>Faire une autre demande</button>
          </div>
        ) : (
          <form className="form-card" onSubmit={handleFormSubmit}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 28 }}>Demander une démonstration gratuite</h3>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Nom complet</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="form-input" placeholder="Dr. Mehdi Alaoui" required />
              </div>
              <div className="form-field">
                <label className="form-label">Spécialité</label>
                <input type="text" name="specialty" value={formData.specialty} onChange={handleFormChange} className="form-input" placeholder="Pédiatrie, Généraliste..." />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Email professionnel</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} className="form-input" placeholder="dr.alaoui@cabinet.ma" required />
            </div>
            <div className="form-field">
              <label className="form-label">Message (Facultatif)</label>
              <textarea name="message" value={formData.message} onChange={handleFormChange} className="form-input" placeholder="Dites-nous en plus sur vos besoins cliniques ou de gestion..." />
            </div>
            <button className="btn-submit" type="submit">Demander ma démo gratuite →</button>
          </form>
        )}
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon" style={{ width: 30, height: 30 }}>
              <HeartIcon size={14} color="white" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: 'white' }}>MedPredict</span>
            <span className="footer-copy" style={{ marginLeft: 16 }}>© 2025 · Innovation Clinique et Médicale au Maroc</span>
          </div>
          <div className="footer-links">
            <a href="#">Confidentialité</a>
            <a href="#">Sécurité</a>
            <a href="#">Conformité CNDP</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;