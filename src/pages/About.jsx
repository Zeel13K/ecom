import React from 'react'
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/About.css';
import '../styles/Footer.css';
import '../styles/Header.css';

const About = () => {
  return (
    <>
      <Header />

      <div className="page-container">
        <section className="hero-section">
          <img src="./aboutimg.jpeg" alt="Our Store" />
          <div className="hero-text">
            <h1>Our Story</h1>
            <p>Learn about the team and values that make E-Store special</p>
          </div>
        </section>
        <section className="story-section">
          <div className="story-content">
            <h2>From Vision to Reality</h2>
            <p>E-Store was founded in 2020 with a clear vision: to create a seamless online shopping experience that puts customers first. What began as a small startup has grown into a trusted marketplace for quality products across multiple categories.</p>
            <p>Our mission is to connect people with products they'll love, delivered with exceptional service and backed by our satisfaction guarantee. Every day, we strive to make online shopping more personal, more intuitive, and more enjoyable.</p>
          </div>
        </section>
        <section className="values-section">
          <h2 className="section-title">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <img src="./qualityimg.jpg" alt="Quality" />
              </div>
              <h3>Quality First</h3>
              <p>We carefully select each product to ensure it meets our high standards for quality and performance. We believe that every purchase should exceed your expectations.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <img src="./customerservices.jpeg" alt="Customer Service" />
              </div>
              <h3>Customer Service</h3>
              <p>Our dedicated support team is always ready to assist with any questions or concerns you might have. Your satisfaction is our top priority from browsing to delivery.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <img src="./innovation.jpg" alt="Innovation" />
              </div>
              <h3>Innovation</h3>
              <p>We continuously improve our platform and product offerings to better serve our customers' needs. We embrace new technologies to enhance your shopping experience.</p>
            </div>
          </div>
        </section>
        <section className="team-section">
          <h2 className="section-title">Meet Our Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo">
                <img src="./johndoe.jpeg" alt="Team Member" />
              </div>
              <div className="member-info">
                <h3>Jane Doe</h3>
                <p>Founder &amp; CEO</p>
              </div>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <img src="./johnsimth.jpeg" alt="Team Member" />
              </div>
              <div className="member-info">
                <h3>John Smith</h3>
                <p>Head of Operations</p>
              </div>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <img src="./jhonson.jpeg" alt="Team Member" />
              </div>
              <div className="member-info">
                <h3>Emily Johnson</h3>
                <p>Customer Service Manager</p>
              </div>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <img src="./browm.jpeg" alt="Team Member" />
              </div>
              <div className="member-info">
                <h3>Michael Brown</h3>
                <p>Product Specialist</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}

export default About