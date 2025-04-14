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
      
      const response = await getAllUsers();
      console.log('Users data received:', response.data);
      
      // Transform data if needed to ensure consistent structure
      const formattedUsers = Array.isArray(response.data) 
        ? response.data.map(user => ({
            _id: user._id || user.id || String(Date.now()),
            name: user.name || user.userName || 'Unknown',
            email: user.email || 'No email',
            isAdmin: Boolean(user.isAdmin),
            createdAt: user.createdAt || user.created || new Date().toISOString(),
            // Add other fields as needed
          }))
        : [];
      
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
      
      // Mock users for development when API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Falling back to mock users');
        const mockUsers = [
          {
            _id: 'mock-user-1',
            name: 'John Doe',
            email: 'john@example.com',
            isAdmin: false,
            createdAt: '2023-05-15T10:30:00Z'
          },
          {
            _id: 'mock-user-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            isAdmin: false,
            createdAt: '2023-06-20T14:45:00Z'
          },
          {
            _id: 'mock-admin-1',
            name: 'Admin User',
            email: 'admin@example.com',
            isAdmin: true,
            createdAt: '2023-01-01T00:00:00Z'
          }
        ];
        setUsers(mockUsers);
        setError(null);
      } else {
        // Check if we have a response with error details
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to load users. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
      console.log('Not authenticated as admin, redirecting to admin login');
      navigate('/admin/login');
      return;
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
      
      console.log(`Toggling admin status for user ${userId} to ${updatedUser.isAdmin}`);
      
      // Update in the backend
      if (process.env.NODE_ENV !== 'development') {
        await updateUser(userId, updatedUser);
      } else {
        // Simulate API delay in development
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
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
      console.log('Saving user changes:', editingUser);
      
      if (process.env.NODE_ENV !== 'development') {
        await updateUser(editingUser._id, editingUser);
      } else {
        // Simulate API delay in development
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
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
      console.log(`Deleting user: ${userToDelete._id}`);
      
      if (process.env.NODE_ENV !== 'development') {
        // Delete from backend
        await deleteUser(userToDelete._id);
      } else {
        // Simulate API delay in development
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
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

  // Format date nicely
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout activeTab="users">
      <div className="admin-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Total users: {users.length} ({users.filter(u => u.isAdmin).length} admins)</p>
        </div>
        <div className="admin-actions">
          <div className="user-filter">
            <select value={filter} onChange={handleFilterChange}>
              <option value="all">All Users</option>
              <option value="admin">Admin Users</option>
              <option value="customer">Regular Users</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchUsers} disabled={loading}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {editMode && editingUser && (
        <div className="user-edit-form">
          <div className="user-edit-title">
            <h2>Edit User</h2>
          </div>
          <div className="user-edit-form-row">
            <div className="user-edit-field">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editingUser.name}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="user-edit-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editingUser.email}
                onChange={handleEditFormChange}
              />
            </div>
          </div>
          <div className="user-edit-checkbox">
            <input
              type="checkbox"
              id="isAdmin"
              name="isAdmin"
              checked={editingUser.isAdmin}
              onChange={handleEditFormChange}
            />
            <label htmlFor="isAdmin">Admin User</label>
          </div>
          <div className="user-edit-actions">
            <button className="user-edit-cancel" onClick={handleCancelEdit}>Cancel</button>
            <button className="user-edit-save" onClick={handleSaveUser}>Save Changes</button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="admin-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading users...</p>
        </div>
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
                {formatDate(user.createdAt)}
              </div>
              <div className="user-actions">
                <button
                  className={`user-action-btn admin-toggle ${user.isAdmin ? 'active' : ''}`}
                  onClick={() => handleToggleAdmin(user._id)}
                  title={user.isAdmin ? 'Remove admin privileges' : 'Make admin'}
                >
                  <i className="fas fa-crown"></i>
                </button>
                <button
                  className="user-action-btn edit"
                  onClick={() => handleEditUser(user)}
                  title="Edit user"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="user-action-btn delete"
                  onClick={() => confirmDelete(user)}
                  title="Delete user"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && userToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="delete-modal-content">
              <p>Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="delete-modal-actions">
              <button className="delete-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="delete-confirm" onClick={handleDeleteUser}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers; 