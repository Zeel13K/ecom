import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import '../styles/Profile.css';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Fill form with current user data
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: {
          street: currentUser.address?.street || '',
          city: currentUser.address?.city || '',
          state: currentUser.address?.state || '',
          zipCode: currentUser.address?.zipCode || '',
          country: currentUser.address?.country || ''
        }
      });
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      updateUserProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' });
    }
  };

  if (!currentUser) {
    return null; // Handle loading state or redirect
  }

  return (
    <>
      <Header />
      <main className="profile-page-container">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>View and edit your personal information</p>
          </div>
          
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
              ) : (
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: currentUser.firstName || '',
                      lastName: currentUser.lastName || '',
                      email: currentUser.email || '',
                      phone: currentUser.phone || '',
                      address: {
                        street: currentUser.address?.street || '',
                        city: currentUser.address?.city || '',
                        state: currentUser.address?.state || '',
                        zipCode: currentUser.address?.zipCode || '',
                        country: currentUser.address?.country || ''
                      }
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    disabled={true} // Email cannot be changed
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <h3 className="address-heading">Address Information</h3>
              
              <div className="form-group full-width">
                <label htmlFor="street">Street Address</label>
                <input 
                  type="text" 
                  id="street" 
                  name="address.street" 
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input 
                    type="text" 
                    id="city" 
                    name="address.city" 
                    value={formData.address.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State/Province</label>
                  <input 
                    type="text" 
                    id="state" 
                    name="address.state" 
                    value={formData.address.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP/Postal Code</label>
                  <input 
                    type="text" 
                    id="zipCode" 
                    name="address.zipCode" 
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input 
                    type="text" 
                    id="country" 
                    name="address.country" 
                    value={formData.address.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              {isEditing && (
                <div className="form-actions">
                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile; 