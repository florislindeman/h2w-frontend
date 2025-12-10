import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  categories?: Category[];
}

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_name: string;
  upload_date: string;
  uploaded_by: string;
  file_url: string;
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

type TabType = 'documents' | 'users' | 'categories';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ 
  email: '', 
  password: '', 
  full_name: '', 
  role: 'medewerker',
  department_id: null,
  category_ids: [] as string[]
});

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Fetch documents
      const docsRes = await fetch(`${API_URL}/documents/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docsData = await docsRes.json();
      setDocuments(docsData);

      // Fetch users
      const usersRes = await fetch(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch categories
      const catsRes = await fetch(`${API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catsData = await catsRes.json();
      setCategories(catsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(documents.filter(d => d.id !== docId));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleUpdateUserCategories = async (userId: string, categoryIds: string[]) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/users/${userId}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category_ids: categoryIds }),
      });
      fetchData(); // Refresh data
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user categories:', error);
      alert('Failed to update user categories');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/categories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });
      const data = await response.json();
      setCategories([...categories, data]);
      setNewCategory({ name: '', description: '' });
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleCreateUser = async () => {
  if (!newUser.email.trim() || !newUser.password.trim() || !newUser.full_name.trim()) {
    alert('Please fill in all required fields');
    return;
  }
  
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error response:', data);
      alert(data.detail || JSON.stringify(data));
      return;
    }
    
    setUsers([...users, data]);
    setNewUser({ email: '', password: '', full_name: '', role: 'user', category_ids: [] });
    setShowCreateUserModal(false);
    fetchData(); // Refresh to get updated data
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Network error: ' + error);
  }
};

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      xlsx: '📊',
      pptx: '📊',
      txt: '📃',
    };
    return icons[fileType] || '📎';
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>H2W Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => navigate('/dashboard')} className="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('documents')} 
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span>Documents</span>
            <span className="badge">{documents.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')} 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>Users</span>
            <span className="badge">{users.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('categories')} 
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Categories</span>
            <span className="badge">{categories.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/dashboard')} className="logout-btn">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              {activeTab === 'documents' && 'Document Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'categories' && 'Category Management'}
            </h1>
            <p className="admin-subtitle">
              {activeTab === 'documents' && 'View and manage all documents'}
              {activeTab === 'users' && 'Manage user roles and permissions'}
              {activeTab === 'categories' && 'Organize content with categories'}
            </p>
          </div>
          {activeTab === 'users' && (
            <button onClick={() => setShowCreateUserModal(true)} className="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              New User
            </button>
          )}
          {activeTab === 'categories' && (
            <button onClick={() => setShowCategoryModal(true)} className="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Category
            </button>
          )}
        </header>

        {loading ? (
          <div className="loading-state">
            <svg className="spinner" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Uploaded</th>
                      <th>Categories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="table-cell-content">
                            <span className="file-icon">{getFileIcon(doc.file_type)}</span>
                            <span className="file-name">{doc.title}</span>
                          </div>
                        </td>
                        <td><span className="badge-small">{doc.file_type.toUpperCase()}</span></td>
                        <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="category-pills">
                            {doc.categories?.map(cat => (
                              <span key={cat.id} className="category-pill">{cat.name}</span>
                            )) || <span className="text-muted">No categories</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="View">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </a>
                            <button 
                              onClick={() => {
                                setDeleteTarget({ type: 'document', id: doc.id, name: doc.title });
                                setShowDeleteModal(true);
                              }}
                              className="btn-icon btn-danger"
                              title="Delete"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Categories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span>{user.full_name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                        <select 
  value={user.role} 
  onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
  className="role-select"
>
  <option value="medewerker">Medewerker</option>
  <option value="manager">Manager</option>
  <option value="admin">Admin</option>
</select>
                        </td>
                        <td>
                          <div className="category-pills">
                            {user.categories?.map(cat => (
                              <span key={cat.id} className="category-pill">{cat.name}</span>
                            )) || <span className="text-muted">All categories</span>}
                          </div>
                        </td>
                        <td>
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="btn-small"
                          >
                            Manage Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-header">
                      <h3>{category.name}</h3>
                      <span className="category-count">
                        {documents.filter(d => d.categories?.some(c => c.id === category.id)).length} docs
                      </span>
                    </div>
                    {category.description && (
                      <p className="category-description">{category.description}</p>
                    )}
                    <div className="category-users">
                      {users.filter(u => u.categories?.some(c => c.id === category.id)).length} users have access
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Deletion</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
              <p className="text-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeleteDocument(deleteTarget?.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* User Categories Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Access for {selectedUser.full_name}</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-4">Select which categories this user can access:</p>
              <div className="checkbox-group">
                {categories.map((category) => (
                  <label key={category.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      defaultChecked={selectedUser.categories?.some(c => c.id === category.id)}
                      onChange={(e) => {
                        const currentCats = selectedUser.categories?.map(c => c.id) || [];
                        const newCats = e.target.checked 
                          ? [...currentCats, category.id]
                          : currentCats.filter(id => id !== category.id);
                        handleUpdateUserCategories(selectedUser.id, newCats);
                      }}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Category</h2>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., HR Documents"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateCategory}>Create Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New User</h2>
              <button className="modal-close" onClick={() => setShowCreateUserModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>
            <div className="form-group">
  <label className="form-label">Role</label>
 <select
  value={newUser.role}
  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
  className="form-input"
>
  <option value="medewerker">Medewerker</option>
  <option value="manager">Manager</option>
  <option value="admin">Admin</option>
</select>
</div>
              <div className="form-group">
                <label className="form-label">Assign Categories</label>
                <div className="checkbox-group">
                  {categories.map((category) => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUser.category_ids.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ 
                              ...newUser, 
                              category_ids: [...newUser.category_ids, category.id] 
                            });
                          } else {
                            setNewUser({ 
                              ...newUser, 
                              category_ids: newUser.category_ids.filter(id => id !== category.id) 
                            });
                          }
                        }}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateUser}>Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
