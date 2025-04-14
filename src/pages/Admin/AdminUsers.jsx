import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getAllUsers, updateUser, deleteUser } from '../../services/api';
import '../../styles/Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();

  // Fetch users from the API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users from API...');
      console.log('Auth token:', localStorage.getItem('authToken'));
      
      const response = await getAllUsers();
      console.log('Users data received:', response.data);
      
      // Transform data if needed to ensure consistent structure
      const formattedUsers = response.data.map(user => ({
        _id: user._id || user.id || String(Date.now()),
        name: user.name || user.userName || 'Unknown',
        email: user.email || 'No email',
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt || user.created || new Date().toISOString(),
        // Add other fields as needed
      }));
      
      setUsers(formattedUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      
      // Show detailed error for debugging
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('Error request:', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      // Check if we have a response with error details
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if admin is logged in and set auth token
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/admin/login');
      return;
    }
    
    // Set a mock JWT token for admin if not already set
    if (!localStorage.getItem('authToken')) {
      // This is a temporary solution - in production, the admin login should set a proper JWT token
      const adminToken = 'admin-jwt-token-' + Date.now();
      localStorage.setItem('authToken', adminToken);
      console.log('Setting mock admin token:', adminToken);
    }
    
    // Load users from API
    fetchUsers();
  }, [navigate]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredUsers = filter === 'all' 
    ? users 
    : filter === 'admin' 
      ? users.filter(u => u.isAdmin) 
      : users.filter(u => !u.isAdmin);

  // Toggle admin status
  const handleToggleAdmin = async (userId) => {
    try {
      // Find the user
      const user = users.find(u => u._id === userId);
      if (!user) return;

      // Toggle admin status
      const updatedUser = { ...user, isAdmin: !user.isAdmin };
      
      // Update in the backend
      await updateUser(userId, updatedUser);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  // Open edit mode
  const handleEditUser = (user) => {
    setEditingUser({...user});
    setEditMode(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    try {
      await updateUser(editingUser._id, editingUser);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === editingUser._id ? editingUser : u
        )
      );
      
      // Exit edit mode
      setEditMode(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Failed to save user changes');
    }
  };

  // Handle form changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingUser(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Delete from backend
      await deleteUser(userToDelete._id);
      
      // Remove from state
      setUsers(users.filter(u => u._id !== userToDelete._id));
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  return (
    <AdminLayout activeTab="users">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <div className="admin-actions">
          <div className="user-filter">
            <select value={filter} onChange={handleFilterChange}>
              <option value="all">All Users</option>
              <option value="admin">Admin Users</option>
              <option value="customer">Regular Users</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : error ? (
        <div className="admin-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchUsers}>Try Again</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-users"></i>
          <p>No users found</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-header">
            <div className="user-id">ID</div>
            <div className="user-name">Name</div>
            <div className="user-email">Email</div>
            <div className="user-status">Status</div>
            <div className="user-date">Joined Date</div>
            <div className="user-actions">Actions</div>
          </div>
          
          {filteredUsers.map(user => (
            <div className="admin-table-row" key={user._id || `user-${Math.random()}`}>
              <div className="user-id">
                {user._id ? user._id.substring(Math.max(0, user._id.length - 8)) : 'N/A'}
              </div>
              <div className="user-name">{user.name || 'Unknown'}</div>
              <div className="user-email">{user.email || 'No email'}</div>
              <div className="user-status">
                <span className={`status-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="user-date">
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString() 
                  : 'Unknown date'
                }
              </div>
              <div className="user-actions">
                <button 
                  className={`admin-toggle-btn ${user.isAdmin ? 'admin' : ''}`}
                  onClick={() => handleToggleAdmin(user._id)}
                  title={user.isAdmin ? "Remove admin privileges" : "Grant admin privileges"}
                >
                  <i className={`fas fa-${user.isAdmin ? 'shield-alt' : 'user-shield'}`}></i>
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => handleEditUser(user)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => confirmDelete(user)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit User Modal */}
      {editMode && editingUser && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h2>Edit User</h2>
              <button className="close-btn" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={editingUser.name} 
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={editingUser.email} 
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="isAdmin" 
                    checked={editingUser.isAdmin} 
                    onChange={handleEditFormChange}
                  />
                  Admin Privileges
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              <button className="save-btn" onClick={handleSaveUser}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?</p>
              <p className="warning">This action cannot be undone. All user data including order history will be permanently deleted.</p>
            </div>
            <div className="admin-modal-footer">
              <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteUser}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers; 