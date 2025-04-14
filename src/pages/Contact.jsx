import React, { useState } from 'react'
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submitContactForm } from '../services/api';
import '../styles/Contact.css';
import '../styles/Footer.css';
import '../styles/Header.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Add timestamp 
      const messageData = {
        ...formData,
        date: new Date().toISOString()
      };
      
      // Send to backend
      await submitContactForm(messageData);
      
      // Reset form and show success message
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSubmitted(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('Failed to send your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-container">
        <section className="contact-header">
          <h1>Get in Touch</h1>
          <p>We're here to help with any questions or feedback you might have about our products and services.</p>
        </section>
        <section className="contact-wrapper">
          <div className="contact-info-card">
            <div className="info-header">
              <h2>Contact Information</h2>
            </div>
            <div className="info-content">
              <div className="info-item">
                <div className="info-icon">📧</div>
                <div className="info-text">
                  <h3>Email</h3>
                  <p>support@estore.com</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">📞</div>
                <div className="info-text">
                  <h3>Phone</h3>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">📍</div>
                <div className="info-text">
                  <h3>Address</h3>
                  <p>123 E-Commerce St<br />Shopping District<br />Retail City, RC 10101</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🕒</div>
                <div className="info-text">
                  <h3>Business Hours</h3>
                  <p>Monday - Friday: 9am - 6pm<br />Saturday: 10am - 4pm<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
            <div className="contact-image">
              <img src="./customersupport.jpeg" alt="Customer Support" />
            </div>
          </div>
          <div className="contact-form-card">
            <div className="form-header">
              <h2>Send us a Message</h2>
            </div>
            <div className="form-content">
              {submitted ? (
                <div className="form-success">
                  <h3>Thank you for your message!</h3>
                  <p>We have received your inquiry and will respond as soon as possible.</p>
                </div>
              ) : (
                <form id="contactForm" className="form-grid" onSubmit={handleSubmit}>
                  {error && (
                    <div className="form-error">
                      <p>{error}</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address" 
                      required 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="subject">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      name="subject" 
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?" 
                      required 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="message">Message</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?" 
                      rows={5} 
                      required 
                    />
                  </div>
                  <div className="form-group full-width">
                    <button 
                      type="submit" 
                      className={`submit-btn ${loading ? 'loading' : ''}`}
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How can I track my order?</h3>
              <p>Once your order ships, you will receive a tracking number via email that you can use to monitor your package's delivery status through your account dashboard or our tracking page.</p>
            </div>
            <div className="faq-item">
              <h3>What is your return policy?</h3>
              <p>We offer a 30-day return policy for most items. Products must be in their original condition and packaging. Simply contact our support team to initiate the return process.</p>
            </div>
            <div className="faq-item">
              <h3>Do you ship internationally?</h3>
              <p>Yes, we ship to select international locations. Shipping costs and delivery times vary based on destination. You can check available shipping options during checkout.</p>
            </div>
            <div className="faq-item">
              <h3>How can I change or cancel my order?</h3>
              <p>To change or cancel an order, please contact our customer service team as soon as possible. We can usually accommodate changes if the order hasn't shipped yet.</p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}

export default Contact