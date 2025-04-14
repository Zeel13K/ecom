import React, { useState } from 'react'
import "../styles/hero.css";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Home = () => {
  const [openFaqs, setOpenFaqs] = useState([]);

  const toggleFaq = (index) => {
    setOpenFaqs(prev => {
      // If this FAQ is already open, close it
      if (prev.includes(index)) {
        return prev.filter(item => item !== index);
      } 
      // Otherwise open it
      else {
        return [...prev, index];
      }
    });
  };

  return (
    <>
    <Header/>
      <div>
        <main className="hero">
          <div className="hero-content">
            <h1>Transform Your Shopping Experience Today</h1>
            <p>Discover a seamless online shopping platform designed just for you. Explore our diverse range of products and enjoy an effortless checkout process.</p>
            <div className="cta-buttons">
              <Link to="/shop" className="shop-btn">Shop</Link>
              <Link to="/about" className="learn-more-btn">Learn More</Link>
            </div>
            <div className="hero-admin-link">
              <Link to="/admin/login">Admin Login</Link>
            </div>
          </div>
        </main>
     
        {/* Features Section */}
     
        <section className="features">
          <h2>Experience Lightning-Fast Shipping for<br />Your Online Purchases Every Time!</h2>
          <div className="features-grid">
        
            {/* Feature Card 1 */}
        
            <div className="feature-card">
              <img src="./img2.jpg" alt="Secure Payments" />
              <h3>Shop with Confidence: Secure Payments for a Worry-Free Experience</h3>
              <p>Explore our extensive range of products tailored to meet your needs.</p>
              <Link to="/shop" className="feature-link">Shop <span className="arrow">→</span></Link>
            </div>
       
            {/* Feature Card 2 */}
       
            <div className="feature-card">
              <img src="./img1.jpg" alt="Diverse Products" />
              <h3>Discover a Diverse Selection of Quality Products at Your Fingertips</h3>
              <p>Find everything from electronics to fashion, all in one place.</p>
              <Link to="/shop" className="feature-link">Browse <span className="arrow">→</span></Link>
            </div>
        
            {/* Feature Card 3 */}
        
            <div className="feature-card">
              <img src="./img3.jpg" alt="User Friendly Navigation" />
              <h3>Enjoy Seamless Shopping with User-Friendly Navigation and Design</h3>
              <p>Our intuitive interface makes online shopping a breeze for everyone.</p>
              <Link to="/shop" className="feature-link">Explore <span className="arrow">→</span></Link>
            </div>
          </div>
        </section>
      
        {/* Services Section */}
      
        <section className="services">
          <div className="services-container">
            <span className="subtitle">Quality</span>
            <h2>Exceptional Services for Every Shopper</h2>
            <p className="services-description">
              We prioritize your shopping experience with our top-notch services. Enjoy hassle-free returns and dedicated support at any time.
            </p>
            <div className="services-grid">
              <div className="service-item">
                <h3>Free Returns</h3>
                <p>Shop with confidence knowing you can return items at no cost within 30 days.</p>
              </div>
              <div className="service-item">
                <h3>24/7 Customer Support</h3>
                <p>Our dedicated team is here to assist you anytime, day or night, for any inquiries.</p>
              </div>
              <div className="service-item">
                <h3>Gift Wrapping Available</h3>
                <p>Make your gifts special with our elegant wrapping service, perfect for any occasion.</p>
              </div>
            </div>
          </div>
        </section>
      
        {/* Support Section */}
      
        <section className="support-section">
          <div className="support-container">
            <div className="support-content">
              <h2>24/7 Customer Support</h2>
              <p>Our dedicated support team is always here to help you with any questions or concerns. Experience exceptional service around the clock.</p>
              <div className="rating">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star inactive">★</span>
              </div>
              <Link to="/contact" className="contact-btn">Contact Support</Link>
            </div>
            <div className="support-image">
              <img src="./TabPane.jpg" alt="Customer Support Illustration" />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        
        <section className="benefits-section">
          <div className="benefits-container">
            <div className="benefits-content">
              <h2>Discover the Unmatched Benefits of Shopping with Us Today!</h2>
              <p>Experience quality assurance with every purchase, ensuring you receive only the best. Enjoy our best price guarantee and earn rewards that enhance your shopping experience!</p>
            </div>
            <div className="benefits-image">
              <img src="./laptop.jpg" alt="Online Fashion Store Shopping" />
            </div>
          </div>
        </section>
       
        {/* Featured Products Section */}
      
        <section className="featured-section">
          <div className="featured-container">
            <div className="featured-content">
              <span className="subtitle">Discover</span>
              <h2>Explore Our Exclusive Featured Products Today</h2>
              <p>Uncover the best selections in our featured products section. Each item is carefully curated to meet your needs and enhance your shopping experience.</p>
              <div className="featured-buttons">
                <Link to="/shop" className="shop-btn">Shop</Link>
                <Link to="/about" className="learn-more-btn">Learn More →</Link>
              </div>
            </div>
            <div className="featured-image">
              <img src="./phone.jpg" alt="Mobile Shopping Experience" />
            </div>
          </div>
        </section>
     
        {/* Testimonial Section */}
     
        <section className="testimonial-section">
          <div className="testimonial-container">
            <div className="rating">
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
            </div>
            <blockquote>
              "This platform has transformed my online business! The seamless integration and user-friendly design made all the difference."
            </blockquote>
            <div className="testimonial-author">
              <div className="author-info">
                <p className="author-name">Jane Doe</p>
                <p className="author-title">CEO, Tech Solutions</p>
              </div>
              <img src="./line.svg" alt="Divider" className="divider" />
              <img src="./company.svg" alt="Webflow Logo" className="company-logo" />
            </div>
          </div>
        </section>
    
        {/* FAQ Section */}
    
        <section className="faq-section">
          <div className="faq-container">
            <h2>FAQs</h2>
            <p className="faq-description">Find answers to your questions and enhance your shopping experience with our helpful FAQs.</p>
            <div className="faq-list">
              <div className={`faq-item ${openFaqs.includes(0) ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(0)}>
                  <h3>What payment methods accepted?</h3>
                  <button type="button" className="toggle-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleFaq(0);
                  }}>×</button>
                </div>
                <div className="faq-answer">
                  <p>We accept various payment methods including credit cards, PayPal and bank transfers. All transactions are secure and encrypted. Choose the option that suits you best at checkout.</p>
                </div>
              </div>
              <div className={`faq-item ${openFaqs.includes(1) ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(1)}>
                  <h3>How to track order?</h3>
                  <button type="button" className="toggle-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleFaq(1);
                  }}>×</button>
                </div>
                <div className="faq-answer">
                  <p>Once your order is shipped, you will receive a tracking number via email. Use this number on our website to monitor your order's progress. If you have any issues, feel free to reach out to us.</p>
                </div>
              </div>
              <div className={`faq-item ${openFaqs.includes(2) ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(2)}>
                  <h3>What is your return policy?</h3>
                  <button type="button" className="toggle-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleFaq(2);
                  }}>×</button>
                </div>
                <div className="faq-answer">
                  <p>We offer a 30-day return policy on most items. Products must be in their original condition and packaging. Please visit our Returns page for more details.</p>
                </div>
              </div>
              <div className={`faq-item ${openFaqs.includes(3) ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(3)}>
                  <h3>Do you ship internationally?</h3>
                  <button type="button" className="toggle-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleFaq(3);
                  }}>×</button>
                </div>
                <div className="faq-answer">
                  <p>Yes, we ship to select international locations. Shipping costs and delivery times vary based on your location. Check our shipping policy for more information.</p>
                </div>
              </div>
              <div className={`faq-item ${openFaqs.includes(4) ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(4)}>
                  <h3>How to contact support?</h3>
                  <button type="button" className="toggle-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleFaq(4);
                  }}>×</button>
                </div>
                <div className="faq-answer">
                  <p>You can reach our support team via the Contact page on our website. We are available through email and live chat. Our team is ready to assist you with any inquiries.</p>
                </div>
              </div>
            </div>
            <div className="faq-footer">
              <h3>Still have questions?</h3>
              <p>We're here to help you with any inquiries.</p>
              <Link to="/contact" className="contact-btn">Contact</Link>
            </div>
          </div>
        </section>
      
        {/* Shopping Benefits Banner */}
      
        <section className="benefits-banner">
          <div className="banner-content">
            <div className="banner-text">
              <h2>Unlock Exclusive Shopping Benefits</h2>
              <p>Sign up now for special offers and personalized deals!</p>
            </div>
            <div className="banner-buttons">
              <Link to="/signup" className="join-btn">Join</Link>
              <Link to="/about" className="learn-more-btn">Learn More</Link>
            </div>
          </div>
        </section>
      </div>
      
      {/* Admin Login Link - Discreet placement */}
      <div className="admin-login-link">
        <Link to="/admin/login">Admin Portal</Link>
      </div>
      
    <Footer/>
    </>
  )
}

export default Home;