import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  Shield,
  Network,
  Search,
  AlertTriangle,
  Building2,
  FileText,
  Zap,
  CheckCircle2,
} from 'lucide-react';

import './LandingPage.css';

const capabilities = [
  {
    icon: Network,
    title: 'Multi-Hop Transaction Tracing',
    description:
      'Trace complex fund flows across multiple blockchain hops with interactive graph analysis.',
  },
  {
    icon: Shield,
    title: 'Risk & Fraud Analysis',
    description:
      'Identify suspicious patterns, assess risk scores, and detect links to known illicit activity.',
  },
  {
    icon: Building2,
    title: 'VASP Attribution',
    description:
      'Map wallet addresses to centralized exchanges and services using attribution intelligence.',
  },
  {
    icon: FileText,
    title: 'Legal Evidence & Dossiers',
    description:
      'Generate investigation-ready reports with timelines, transaction graphs, and evidentiary documentation.',
  },
];

const workflow = [
  {
    number: '01',
    icon: FileText,
    title: 'Complaint Intake',
    description: 'Input suspicious addresses, transaction hashes, or case details.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Transaction Tracing',
    description: 'Follow funds across multiple hops using blockchain graph analysis.',
  },
  {
    number: '03',
    icon: AlertTriangle,
    title: 'Risk Assessment',
    description: 'Analyze patterns and calculate risk scores using forensic heuristics.',
  },
  {
    number: '04',
    icon: Building2,
    title: 'VASP Identification',
    description: 'Identify exchanges and services linked to suspicious transactions.',
  },
  {
    number: '05',
    icon: FileText,
    title: 'Legal Dossier',
    description: 'Export comprehensive reports for investigation and legal proceedings.',
  },
];

const technologies = [
  'React',
  'FastAPI',
  'Neo4j',
  'Redis',
  'Ethereum',
  'Python',
  'Docker',
  'Nginx',
  'Crypto Forensics',
];

export function LandingPage({ onTryPlatform }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <header className="landing-nav">
        <div className="landing-container nav-inner">
          <button
            className="brand"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="brand-mark">
              <Shield size={19} />
            </div>

            <div>
              <div className="brand-name">
                CRYPTO FORENSICS
                <span className="live-badge">LIVE</span>
              </div>

              <div className="brand-subtitle">
                On-Chain Crime Tracing & Intelligence Platform
              </div>
            </div>
          </button>

          <nav className="desktop-nav">
            <button onClick={() => scrollTo('home')}>Home</button>
            <button onClick={() => scrollTo('about')}>About</button>
            <button onClick={() => scrollTo('features')}>Features</button>
            <button onClick={() => scrollTo('workflow')}>How It Works</button>
            <button onClick={() => scrollTo('technology')}>
              Technology
            </button>
            <button onClick={() => scrollTo('team')}>Team</button>
          </nav>

          <button className="primary-button nav-button" onClick={onTryPlatform}>
            Try the Platform
            <ArrowRight size={17} />
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section id="home" className="hero-section">
          <div className="landing-container hero-grid">
            <div className="hero-content">
              <div className="eyebrow">
                BLOCKCHAIN INTELLIGENCE FOR A SAFER TOMORROW
              </div>

              <h1>
                Trace. Analyze.
                <br />
                Stop <span>Crypto Crime.</span>
              </h1>

              <p className="hero-description">
                Crypto Forensics is an AI-powered blockchain investigation
                and cryptocurrency fraud intelligence platform built to assist
                law enforcement agencies in tracking illicit transactions,
                identifying risk, and building court-ready evidence.
              </p>

              <div className="hero-actions">
                <button className="primary-button" onClick={onTryPlatform}>
                  Try the Platform
                  <ArrowRight size={18} />
                </button>

                <button
                  className="secondary-button"
                  onClick={() => scrollTo('features')}
                >
                  Learn More
                  <ArrowDown size={17} />
                </button>
              </div>

              <div className="hero-highlights">
                <span>
                  <Zap size={17} />
                  Real-Time Analysis
                </span>

                <span>
                  <Network size={17} />
                  Multi-Chain Support
                </span>

                <span>
                  <Shield size={17} />
                  Investigation Focused
                </span>

                <span>
                  <Shield size={17} />
                  Open Source
                </span>
              </div>
            </div>

            {/* VISUAL */}
            <div className="hero-visual">
              <div className="globe-grid">
                <div className="globe">
                  <div className="globe-ring ring-one" />
                  <div className="globe-ring ring-two" />
                  <div className="globe-ring ring-three" />

                  <div className="globe-dot dot-one" />
                  <div className="globe-dot dot-two" />
                  <div className="globe-dot dot-three" />
                  <div className="globe-dot dot-four" />

                  <div className="connection connection-one" />
                  <div className="connection connection-two" />
                  <div className="connection connection-three" />
                </div>
              </div>

              <div className="floating-card risk-card">
                <AlertTriangle size={18} />
                <div>
                  <strong>High Risk Address</strong>
                  <span>0x38...f2e9</span>
                </div>
              </div>

              <div className="floating-card transaction-card">
                <Network size={19} />
                <div>
                  <strong>Transaction Traced</strong>
                  <span>5 hops · 12.4 ETH</span>
                </div>
              </div>

              <div className="floating-card vasp-card">
                <Building2 size={18} />
                <div>
                  <strong>VASP Identified</strong>
                  <span>Binance</span>
                </div>
              </div>

              <div className="analysis-card">
                <div className="analysis-title">
                  Fraud Detection
                  <strong>↑ 87%</strong>
                </div>

                <div className="fake-chart">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="analysis-list">
                  {[
                    'Tracing',
                    'Risk Analysis',
                    'VASP Attribution',
                    'Evidence Export',
                  ].map((item) => (
                    <div key={item}>
                      {item}
                      <CheckCircle2 size={15} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="landing-section">
          <div className="landing-container">
            <SectionHeading
              eyebrow="KEY CAPABILITIES"
              title={
                <>
                  Powerful Tools for{' '}
                  <span>Real-World Investigations</span>
                </>
              }
              description="From transaction tracing to legal dossier generation, Crypto Forensics provides end-to-end support for cryptocurrency investigations."
            />

            <div className="capability-grid">
              {capabilities.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="capability-card" key={item.title}>
                    <div className="card-icon">
                      <Icon size={25} />
                    </div>

                    <h3>{item.title}</h3>

                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="landing-section workflow-section">
          <div className="landing-container">
            <SectionHeading
              eyebrow="HOW IT WORKS"
              title={
                <>
                  From Complaint to{' '}
                  <span>Court-Ready Evidence</span>
                </>
              }
              description="A streamlined investigation workflow designed for law enforcement agencies."
            />

            <div className="workflow-grid">
              {workflow.map((item, index) => {
                const Icon = item.icon;

                return (
                  <React.Fragment key={item.number}>
                    <article className="workflow-item">
                      <div className="workflow-icon">
                        <Icon size={24} />
                      </div>

                      <div className="workflow-number">
                        {item.number}
                      </div>

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>
                    </article>

                    {index < workflow.length - 1 && (
                      <div className="workflow-arrow">
                        <ArrowRight />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT + TECHNOLOGY */}
        <section id="about" className="landing-section about-section">
          <div className="landing-container about-grid">
            <div>
              <div className="eyebrow">ABOUT CRYPTO FORENSICS</div>

              <h2>
                Built for <span>Impact</span>
              </h2>

              <p>
                Crypto Forensics is a blockchain investigation platform
                focused on leveraging blockchain analytics, AI, and open-source
                intelligence to support law enforcement in combating
                cryptocurrency-related crime.
              </p>

              <p>
                The platform combines transaction graph analysis, risk
                assessment, VASP attribution, and evidence generation into a
                unified investigation workflow.
              </p>

              <div className="impact-list">
                <div>
                  <Shield size={21} />
                  <span>Investigation Focused</span>
                </div>

                <div>
                  <Network size={21} />
                  <span>Real-Time Intelligence</span>
                </div>

                <div>
                  <Zap size={21} />
                  <span>Open & Extensible</span>
                </div>
              </div>
            </div>

            <div id="technology" className="technology-panel">
              <div className="eyebrow">TECHNOLOGY STACK</div>

              <h2>
                Modern. Modular. <span>Extensible.</span>
              </h2>

              <p>
                Built with modern technologies for performance, scalability,
                graph intelligence, and real-time analysis.
              </p>

              <div className="technology-grid">
                {technologies.map((technology) => (
                  <div className="technology-chip" key={technology}>
                    <span className="technology-dot" />
                    {technology}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section id="team" className="landing-section team-section">
          <div className="landing-container team-content">
            <div className="eyebrow">THE PROJECT</div>

            <h2>
              Built to Make Blockchain Investigations{' '}
              <span>More Accessible.</span>
            </h2>

            <p>
              Crypto Forensics brings together blockchain intelligence,
              graph-based tracing, risk analysis, and legal evidence generation
              into one unified platform.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="landing-container final-cta">
          <div>
            <h2>Ready to make a difference?</h2>
            <p>
              Explore the platform and see how Crypto Forensics can support
              real-world investigations.
            </p>
          </div>

          <button className="primary-button" onClick={onTryPlatform}>
            Try the Platform
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      {/* FOOTER */}
<footer className="landing-footer">
  <div className="landing-container footer-inner">
    <a
      href="https://github.com/Bobby1608/CyberCell-Crypto-Intelligence"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Explore the project on GitHub"
      className="github-link"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.604-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.018.005 2.043.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.805 5.624-5.475 5.921.43.372.823 1.103.823 2.222v3.293c0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0z" />
      </svg>

      <span>Explore the Project on GitHub</span>
    </a>
  </div>
</footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">— {eyebrow} —</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}