import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import '../../styles/Admin.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/admin/login');
      return;
    }
    
    // Load messages from localStorage
    loadMessages();
  }, [navigate]);

  const loadMessages = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      // Sort by date (newest first)
      const sortedMessages = [...storedMessages].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleMarkAsRead = (messageId) => {
    try {
      // Get current messages
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, status: 'read' };
        }
        return msg;
      });
      
      // Update localStorage
      localStorage.setItem('contactMessages', JSON.stringify(updatedMessages));
      
      // Update state
      setMessages(updatedMessages);
      
      // If this is the active message, update it
      if (activeMessage && activeMessage.id === messageId) {
        setActiveMessage({ ...activeMessage, status: 'read' });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        // Filter out the deleted message
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        
        // Update localStorage
        localStorage.setItem('contactMessages', JSON.stringify(updatedMessages));
        
        // Update state
        setMessages(updatedMessages);
        
        // Clear active message if it was deleted
        if (activeMessage && activeMessage.id === messageId) {
          setActiveMessage(null);
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const handleViewMessage = (message) => {
    setActiveMessage(message);
    
    // If message is unread, mark it as read
    if (message.status === 'unread') {
      handleMarkAsRead(message.id);
    }
  };

  return (
    <AdminLayout activeTab="messages">
      <div className="admin-header">
        <h1>Customer Messages</h1>
        <div className="message-count">
          {messages.filter(msg => msg.status === 'unread').length} unread
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-envelope-open"></i>
          <p>No messages found</p>
        </div>
      ) : (
        <div className="admin-card messages-container">
          <div className="messages-wrapper">
            <div className="messages-list">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message-item ${message.status === 'unread' ? 'unread' : ''} ${activeMessage?.id === message.id ? 'active' : ''}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="message-sender">
                    <strong>{message.name}</strong>
                    {message.status === 'unread' && <span className="unread-badge"></span>}
                  </div>
                  <div className="message-subject">{message.subject}</div>
                  <div className="message-preview">
                    {message.message.substring(0, 60)}
                    {message.message.length > 60 ? '...' : ''}
                  </div>
                  <div className="message-date">{formatDate(message.date)}</div>
                </div>
              ))}
            </div>
            
            <div className="message-detail">
              {activeMessage ? (
                <>
                  <div className="message-detail-header">
                    <h2>{activeMessage.subject}</h2>
                    <div className="message-actions">
                      {activeMessage.status === 'unread' && (
                        <button 
                          className="message-action-btn read"
                          onClick={() => handleMarkAsRead(activeMessage.id)}
                        >
                          <i className="fas fa-envelope-open"></i> Mark as Read
                        </button>
                      )}
                      <button 
                        className="message-action-btn delete"
                        onClick={() => handleDeleteMessage(activeMessage.id)}
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="message-detail-meta">
                    <div className="message-from">
                      <span className="meta-label">From:</span> 
                      {activeMessage.name} ({activeMessage.email})
                    </div>
                    <div className="message-received">
                      <span className="meta-label">Received:</span> 
                      {formatDate(activeMessage.date)}
                    </div>
                  </div>
                  
                  <div className="message-detail-content">
                    {activeMessage.message}
                  </div>
                  
                  <div className="message-reply">
                    <button className="dashboard-action-btn">
                      <i className="fas fa-reply"></i> Reply to Message
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-message-selected">
                  <i className="fas fa-envelope"></i>
                  <p>Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages; 