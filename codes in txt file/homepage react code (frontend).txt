import React, { useState, useEffect } from 'react';
import { MapPin, Zap, Clock, Shield, Star, ChevronRight, Car, Navigation, Users, BarChart3, Smartphone, Globe, Award } from 'lucide-react';

function Home() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 3);
    }, 4000);

    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Check visibility of elements
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView) {
          setIsVisible(prev => ({ ...prev, [index]: true }));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Add intersection observer for scroll animations
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  
  const elements = document.querySelectorAll('[data-animate]');
  elements.forEach((el) => observer.observe(el));
  
  return () => observer.disconnect();
}, []);

  const features = [
    {
      icon: <Zap size={24} />,
      title: "Smart Detection",
      description: "AI-powered parking spot detection technology that learns from traffic patterns and user behavior.",
      color: '#f59e0b'
    },
    {
      icon: <Clock size={24} />,
      title: "Time Optimization",
      description: "Advanced algorithms help reduce parking search time through predictive availability analysis.",
      color: '#10b981'
    },
    {
      icon: <Navigation size={24} />,
      title: "Seamless Navigation",
      description: "Integrated GPS with real-time updates and optimal route suggestions for urban parking.",
      color: '#8b5cf6'
    }
  ];

  const stats = [
    { number: "Live", label: "Snapshot", color: '#3b82f6' },
    { number: "Trial", label: "Phase", color: '#10b981' },
    { number: "AI", label: "Powered", color: '#f59e0b' },
    { number: "Dev", label: "Ready", color: '#8b5cf6' }
  ];

  const workSteps = [
    {
      step: "1",
      title: "Search & Discover",
      description: "Enter your destination and explore available parking options in your area with intelligent filtering.",
      icon: <Globe size={32} />,
      color: '#3b82f6'
    },
    {
      step: "2", 
      title: "Reserve & Navigate",
      description: "Book your preferred spot and get optimized navigation with real-time traffic updates.",
      icon: <Navigation size={32} />,
      color: '#10b981'
    },
    {
      step: "3",
      title: "Park & Manage",
      description: "Arrive at your destination and manage your parking session through the intuitive interface.",
      icon: <Smartphone size={32} />,
      color: '#8b5cf6'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.floatingShape,
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][i],
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header style={{
        ...styles.header,
        backgroundColor: scrollY > 50 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        boxShadow: scrollY > 50 ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none'
      }}>
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <MapPin size={20} color="#ffffff" />
            </div>
            <span style={{ ...styles.logoText, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>NextSpot</span>
            <span style={styles.betaBadge}>ParkPlus</span>
          </div>
          
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#how-it-works" style={styles.navLink}>How it Works</a>
            <a href="#about" style={styles.navLink}>About</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroLeft} data-animate>
            <div style={styles.badge}>
              <Award size={16} color="#059669" />
              <span>Innovative Parking Solution</span>
            </div>
            
            <h1 style={styles.heroTitle}>
              Next-Gen Parking
              <span style={styles.heroTitleAccent}> Intelligence</span>
              <br />for Smart Cities
            </h1>
            
            <p style={styles.heroDescription}>
              NextSpot demonstrates how AI-powered technology can revolutionize urban parking 
              through intelligent detection, seamless booking, and optimized navigation. 
              Experience the future of parking management.
            </p>
            
            <div style={styles.heroButtons}>
              <button 
                onClick={() => window.location.href = '/login'}
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2)';
                }}
              >
                <Car size={20} />
                <span>Find Parking</span>
                <ChevronRight size={16} />
              </button>
              
              <button 
                onClick={() => window.location.href = '/owner-login'}
                style={styles.secondaryButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <MapPin size={20} />
                <span>Add Spots</span>
              </button>
            </div>

            {/* Stats */}
            <div style={styles.stats}>
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.statItem,
                    animationDelay: `${index * 0.2}s`
                  }}
                  data-animate
                >
                  <div style={{...styles.statNumber, color: stat.color}}>{stat.number}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.heroRight} data-animate>
            <div style={styles.phoneWrapper}>
              <div style={{
                ...styles.phone,
                transform: `rotate(-5deg) translateY(${scrollY * 0.05}px)`
              }}>
                <div style={styles.phoneScreen}>
                  <div style={styles.appHeader}>
                    <div style={styles.appLogo}>
                      <MapPin size={16} color="#3b82f6" />
                      <span style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        NextSpot
                      </span>
                    </div>
                    <div style={styles.liveIndicator}>
                      <div style={styles.liveDot}></div>
                      <span>Live</span>
                    </div>
                  </div>
                  
                  <div style={styles.parkingList}>
                    <div style={{...styles.parkingItem, borderColor: '#10b981'}}>
                      <div style={styles.parkingStatus}>
                        <span style={{color: '#10b981'}}>Available Now</span>
                        <Car size={16} color="#10b981" />
                      </div>
                      <div style={styles.parkingLocation}>Phoenix Mills - 2 min walk</div>
                      <div style={styles.parkingPrice}>₹60/hour</div>
                    </div>
                    
                    <div style={{...styles.parkingItem, borderColor: '#3b82f6'}}>
                      <div style={styles.parkingStatus}>
                        <span style={{color: '#3b82f6'}}>Reserved</span>
                        <Clock size={16} color="#3b82f6" />
                      </div>
                      <div style={styles.parkingLocation}>Inorbit Mall - 5 min walk</div>
                      <div style={styles.parkingPrice}>₹45/hour</div>
                    </div>
                    
                    <div style={{...styles.parkingItem, borderColor: '#8b5cf6'}}>
                      <div style={styles.parkingStatus}>
                        <span style={{color: '#8b5cf6'}}>Predicted</span>
                        <Zap size={16} color="#8b5cf6" />
                      </div>
                      <div style={styles.parkingLocation}>BKC - Available in 15 min</div>
                      <div style={styles.parkingPrice}>₹80/hour</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.container}>
          <div style={styles.sectionHeader} data-animate>
            <h2 style={styles.sectionTitle}>Innovative Features</h2>
            <p style={styles.sectionDescription}>
              Cutting-edge technology designed to solve modern urban parking challenges
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={index}
                data-animate
                style={{
                  ...styles.featureCard,
                  transform: currentFeature === index ? 'translateY(-12px) scale(1.02)' : 'translateY(0)',
                  boxShadow: currentFeature === index 
                    ? `0 25px 50px rgba(${feature.color === '#f59e0b' ? '245, 158, 11' : feature.color === '#10b981' ? '16, 185, 129' : '139, 92, 246'}, 0.15)` 
                    : '0 8px 30px rgba(0, 0, 0, 0.08)',
                  background: currentFeature === index 
                    ? `linear-gradient(135deg, ${feature.color}08, ${feature.color}03)`
                    : '#ffffff'
                }}
              >
                <div style={{...styles.featureIcon, backgroundColor: `${feature.color}15`, color: feature.color}}>
                  {feature.icon}
                </div>
                
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
                
                <div style={{...styles.featureAccent, backgroundColor: feature.color}} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={styles.howItWorks}>
        <div style={styles.container}>
          <div style={styles.sectionHeader} data-animate>
            <h2 style={styles.sectionTitle}>How NextSpot Works</h2>
            <p style={styles.sectionDescription}>
              Simple, intuitive process designed for modern urban mobility
            </p>
          </div>

          <div style={styles.stepsGrid}>
            {workSteps.map((step, index) => (
              <div key={index} style={styles.step} data-animate>
                <div style={{...styles.stepIcon, backgroundColor: step.color}}>
                  {step.icon}
                </div>
                <div style={{...styles.stepNumber, borderColor: step.color, color: step.color}}>{step.step}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDescription}>{step.description}</p>
                
                {index < workSteps.length - 1 && (
                  <div style={styles.stepConnector} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About/CTA Section */}
      <section id="about" style={styles.cta}>
        <div style={styles.ctaContent} data-animate>
          <div style={styles.ctaIconWrapper}>
            <Users size={48} style={{color: '#3b82f6'}} />
            <div style={styles.ctaIconGlow} />
          </div>
          
          <h2 style={styles.ctaTitle}>Experience the Future of Parking</h2>
          <p style={styles.ctaDescription}>
            NextSpot is a product showcasing how technology can transform 
            urban mobility. This Solution illustrates the potential of AI-driven solutions 
            for smart city infrastructure.
          </p>
          
          <div style={styles.ctaButtons}>
            <button 
              onClick={() => window.location.href = '/login'}
              style={styles.ctaButton}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2)';
              }}
            >
              Explore
            </button>
            
  
          </div>
          
          <div style={styles.ctaFeatures}>
            <div style={styles.ctaFeature}>
              <Shield size={16} color="#10b981" />
              <span>Secured</span>
            </div>
            <div style={styles.ctaFeature}>
              <span>•</span>
            </div>
            <div style={styles.ctaFeature}>
              <BarChart3 size={16} color="#3b82f6" />
              <span>AI Powered</span>
            </div>
            <div style={styles.ctaFeature}>
              <span>•</span>
            </div>
            <div style={styles.ctaFeature}>
              <Award size={16} color="#f59e0b" />
              <span>Innovation</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    lineHeight: '1.6',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  },
  
  backgroundAnimation: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0
  },
  
  floatingShape: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    opacity: 0.1,
    animation: 'float 20s infinite linear'
  },
  
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backdropFilter: 'blur(15px)',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 1000,
    transition: 'all 0.3s ease'
  },
  
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 2rem'
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  
  betaBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    marginLeft: '0.5rem'
  },
  
  navLinks: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  },
  
  navLink: {
    textDecoration: 'none',
    color: '#6b7280',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  },
  
  hero: {
    paddingTop: '120px',
    paddingBottom: '80px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    position: 'relative',
    zIndex: 1
  },
  
  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center'
  },
  
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeInLeft 1s ease-out'
  },
  
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    color: '#059669',
    padding: '0.75rem 1.25rem',
    borderRadius: '25px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '2rem',
    width: 'fit-content',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
  },
  
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    color: '#111827'
  },
  
  heroTitleAccent: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  
  heroDescription: {
    fontSize: '1.25rem',
    color: '#6b7280',
    lineHeight: '1.7',
    marginBottom: '2.5rem'
  },
  
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '3rem',
    flexWrap: 'wrap'
  },
  
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    padding: '1.25rem 2.5rem',
    borderRadius: '15px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
  },
  
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    padding: '1.25rem 2.5rem',
    borderRadius: '15px',
    border: '2px solid #3b82f6',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2rem',
    marginTop: '1rem'
  },
  
  statItem: {
    textAlign: 'center',
    animation: 'fadeInUp 1s ease-out'
  },
  
  statNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.25rem'
  },
  
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  
  heroRight: {
    display: 'flex',
    justifyContent: 'center',
    animation: 'fadeInRight 1s ease-out'
  },
  
  phoneWrapper: {
    position: 'relative'
  },
  
  phone: {
    width: '300px',
    height: '600px',
    background: 'linear-gradient(135deg, #1f2937, #111827)',
    borderRadius: '35px',
    padding: '20px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease'
  },
  
  phoneScreen: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #000000, #1a1a1a)',
    borderRadius: '25px',
    padding: '20px',
    color: '#ffffff'
  },
  
  appHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  
  appLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600'
  },
  
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#3b82f6'
  },
  
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  
  parkingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  
  parkingItem: {
    padding: '15px',
    borderRadius: '12px',
    border: '1px solid',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  },
  
  parkingStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontWeight: '600'
  },
  
  parkingLocation: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '8px'
  },
  
  parkingPrice: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff'
  },
  
  features: {
    padding: '80px 0',
    backgroundColor: '#ffffff',
    position: 'relative',
    zIndex: 1
  },
  
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
    animation: 'fadeInUp 1s ease-out'
  },
  
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#111827',
    marginBottom: '1rem'
  },
  
  sectionDescription: {
    fontSize: '1.125rem',
    color: '#6b7280',
    maxWidth: '600px',
    margin: '0 auto'
  },
  
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem'
  },
  
  featureCard: {
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    borderRadius: '20px',
    textAlign: 'center',
    transition: 'all 0.4s ease',
    border: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeInUp 1s ease-out'
  },
  
  featureIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    transition: 'all 0.3s ease'
  },
  
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1rem'
  },
  
  featureDescription: {
    color: '#6b7280',
    lineHeight: '1.6'
  },
  
  featureAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    transition: 'all 0.3s ease'
  },
  
  howItWorks: {
    padding: '80px 0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    position: 'relative',
    zIndex: 1
  },
  
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    position: 'relative'
  },
  
  step: {
    textAlign: 'center',
    position: 'relative',
    animation: 'fadeInUp 1s ease-out'
  },
  
  stepIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    color: '#ffffff',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
  },
  
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: '0 auto 1.5rem',
    backgroundColor: '#ffffff'
  },
  
  stepTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1rem'
  },
  
  stepDescription: {
    color: '#6b7280',
    lineHeight: '1.6',
    maxWidth: '300px',
    margin: '0 auto'
  },
  
  stepConnector: {
    position: 'absolute',
    top: '40px',
    right: '-50%',
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    zIndex: -1
  },
  
  cta: {
    padding: '80px 0',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#ffffff',
    position: 'relative',
    zIndex: 1
  },
  
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 2rem',
    textAlign: 'center',
    animation: 'fadeInUp 1s ease-out'
  },
  
  ctaIconWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '2rem'
  },
  
  ctaIconGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'pulse 3s infinite'
  },
  
  ctaTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  
  ctaDescription: {
    fontSize: '1.125rem',
    color: '#94a3b8',
    marginBottom: '2.5rem',
    lineHeight: '1.6'
  },
  
  ctaButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  
  ctaButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    padding: '1.25rem 2.5rem',
    borderRadius: '15px',
    border: 'none',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
  },
  
  ctaSecondaryButton: {
    backgroundColor: 'transparent',
    color: '#3b82f6',
    padding: '1.25rem 2.5rem',
    borderRadius: '15px',
    border: '2px solid #3b82f6',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  
  ctaFeatures: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    color: '#94a3b8',
    fontSize: '0.875rem'
  },
  
  ctaFeature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
};

// Add CSS keyframes for animations
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float {
    0% {
      transform: translateY(100vh) rotate(0deg);
    }
    100% {
      transform: translateY(-100px) rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.1);
    }
  }
  
  [data-animate] {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease-out;
  }
  
  [data-animate].visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Add the stylesheet to the document head
if (!document.querySelector('#nextspot-animations')) {
  styleSheet.id = 'nextspot-animations';
  document.head.appendChild(styleSheet);
}

export default Home;