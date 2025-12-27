import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_URL = 'https://h2wchatbot-production.up.railway.app';

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

interface AuditLog {
  action: string;
  details: string;
  timestamp: Date;
}

type TabType = 'documents' | 'users' | 'categories';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategories, setUploadCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'document' | 'user' | 'category'>('document');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    role: 'medewerker',
    department_id: null as string | null,
    category_ids: [] as string[]
  });

  // Edit Document Modal
  const [showEditDocModal, setShowEditDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docCategoryIds, setDocCategoryIds] = useState<string[]>([]);

  // Edit User Modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserCategories, setEditUserCategories] = useState<string[]>([]);
  const [editUserRole, setEditUserRole] = useState<string>('medewerker');

  // Edit Category Modal
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');

  // Audit Logging
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const addAuditLog = (action: string, details: string) => {
    const log: AuditLog = {
      action,
      details,
      timestamp: new Date()
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 50));
    console.log(`[AUDIT] ${action}: ${details}`);
  };

  // Helper function to check auth and handle 401
  const checkAuth = (response: Response) => {
    if (response.status === 401 || response.status === 403) {
      console.log('Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return false;
    }
    return true;
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
    } catch (e) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      // Fetch Documents
      const docsRes = await fetch(`${API_URL}/api/documents/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(docsRes)) return;
      
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      } else {
        console.error('Failed to fetch documents:', await docsRes.text());
      }

      // Fetch Users
      const usersRes = await fetch(`${API_URL}/api/users/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(usersRes)) return;
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        console.error('Failed to fetch users:', await usersRes.text());
      }

      // Fetch Categories
      const catsRes = await fetch(`${API_URL}/api/categories/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(catsRes)) return;
      
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      } else {
        console.error('Failed to fetch categories:', await catsRes.text());
      }
      
      addAuditLog('DATA_FETCH', 'Loaded all admin data');
    } catch (error) {
      console.error('Error fetching data:', error);
      addAuditLog('ERROR', `Failed to fetch data: ${error}`);
      alert('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    if (uploadCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('category_ids', JSON.stringify(uploadCategories));

    try {
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!checkAuth(response)) return;

      if (response.ok) {
        setUploadSuccess(true);
        addAuditLog('UPLOAD_DOCUMENT', `Uploaded document: ${uploadTitle}`);
        setSelectedFile(null);
        setUploadTitle('');
        setUploadCategories([]);
        await fetchData();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.detail || 'Unknown error'}`);
        addAuditLog('ERROR', `Failed to upload document: ${error.detail}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      addAuditLog('ERROR', `Failed to upload document: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/documents/${doc.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get filename from Content-Disposition header or use document filename
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = doc.file_name;
      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addAuditLog('DOWNLOAD_DOCUMENT', `Downloaded document: ${doc.title}`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
      addAuditLog('ERROR', `Failed to download document: ${error}`);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(response)) return;
      
      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== docId));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        addAuditLog('DELETE_DOCUMENT', `Deleted document: ${deleteTarget?.title}`);
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(response)) return;
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        addAuditLog('DELETE_USER', `Deleted user: ${deleteTarget?.email}`);
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!checkAuth(response)) return;
      
      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryId));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        addAuditLog('DELETE_CATEGORY', `Deleted category: ${deleteTarget?.name}`);
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleDelete = () => {
    if (deleteType === 'document') handleDeleteDocument(deleteTarget?.id);
    else if (deleteType === 'user') handleDeleteUser(deleteTarget?.id);
    else if (deleteType === 'category') handleDeleteCategory(deleteTarget?.id);
  };

  const handleCreateUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.full_name.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      
      if (!checkAuth(response)) return;
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Failed to create user');
        return;
      }
      
      const data = await response.json();
      setUsers([...users, data]);
      setNewUser({ email: '', password: '', full_name: '', role: 'medewerker', department_id: null, category_ids: [] });
      setShowCreateUserModal(false);
      fetchData();
      addAuditLog('CREATE_USER', `Created user: ${newUser.email}`);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Network error: ' + error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/categories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });
      
      if (!checkAuth(response)) return;
      
      if (response.ok) {
        const data = await response.json();
        setCategories([...categories, data]);
        setNewCategory({ name: '', description: '' });
        setShowCategoryModal(false);
        addAuditLog('CREATE_CATEGORY', `Created category: ${newCategory.name}`);
      } else {
        alert('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateDocumentCategories = async () => {
    if (!selectedDoc) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ category_ids: docCategoryIds }),
      });
      
      if (!checkAuth(response)) return;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update document categories');
      }
      
      await fetchData();
      setShowEditDocModal(false);
      setSelectedDoc(null);
      addAuditLog('UPDATE_DOC_CATEGORIES', `Updated categories for document: ${selectedDoc.title}`);
    } catch (error) {
      console.error('Error updating document categories:', error);
      alert(`Failed to update document categories: ${error}`);
      addAuditLog('ERROR', `Failed to update document categories: ${error}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          role: editUserRole,
          category_ids: editUserCategories 
        }),
      });
      
      if (!checkAuth(response)) return;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }
      
      await fetchData();
      setShowEditUserModal(false);
      setSelectedUser(null);
      addAuditLog('UPDATE_USER', `Updated user: ${selectedUser.email}`);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error}`);
      addAuditLog('ERROR', `Failed to update user: ${error}`);
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: editCategoryName,
          description: editCategoryDescription 
        }),
      });
      
      if (!checkAuth(response)) return;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update category');
      }
      
      await fetchData();
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
      addAuditLog('UPDATE_CATEGORY', `Updated category: ${editCategoryName}`);
    } catch (error) {
      console.error('Error updating category:', error);
      alert(`Failed to update category: ${error}`);
      addAuditLog('ERROR', `Failed to update category: ${error}`);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img 
              src="/images/new-concept-group-logo.jpeg" 
              alt="New Concept Group" 
              className="ncg-logo-image"
            />
          </div>
        </div>

        <nav className="sidebar-nav">
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
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span>Categories</span>
            <span className="badge">{categories.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
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
          {activeTab === 'documents' && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload Document
            </button>
          )}
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
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>DOCUMENT</th>
                      <th>TYPE</th>
                      <th>UPLOAD DATE</th>
                      <th>CATEGORIES</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="doc-cell">
                            <span className="doc-icon">{getFileIcon(doc.file_type)}</span>
                            <div>
                              <div className="doc-title">{doc.title}</div>
                              <div className="doc-filename">{doc.file_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="type-badge">{doc.file_type}</span>
                        </td>
                        <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="category-pills">
                            {doc.categories?.map((cat) => (
                              <span key={cat.id} className="category-pill">{cat.name}</span>
                            )) || <span className="text-muted">No categories</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setDocCategoryIds(doc.categories?.map(c => c.id) || []);
                                setShowEditDocModal(true);
                              }}
                              className="btn-icon btn-edit"
                              title="Edit"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="btn-icon btn-download"
                              title="Download"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget(doc);
                                setDeleteType('document');
                                setShowDeleteModal(true);
                              }}
                              className="btn-icon btn-delete"
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

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <>
                <div className="filter-bar">
                  <div className="search-box">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="medewerker">Medewerker</option>
                  </select>
                  <span className="filter-info">
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>CATEGORIES</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>{user.full_name}</div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <div className="category-pills">
                              {user.categories?.map((cat) => (
                                <span key={cat.id} className="category-pill">{cat.name}</span>
                              )) || <span className="text-muted">No categories</span>}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserRole(user.role);
                                  setEditUserCategories(user.categories?.map(c => c.id) || []);
                                  setShowEditUserModal(true);
                                }}
                                className="btn-icon btn-edit"
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget(user);
                                  setDeleteType('user');
                                  setShowDeleteModal(true);
                                }}
                                className="btn-icon btn-delete"
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
              </>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-header">
                      <h3>{category.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setEditCategoryName(category.name);
                            setEditCategoryDescription(category.description || '');
                            setShowEditCategoryModal(true);
                          }}
                          className="btn-icon-small btn-edit"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(category);
                            setDeleteType('category');
                            setShowDeleteModal(true);
                          }}
                          className="btn-icon-small btn-delete"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="category-description">{category.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Audit Log */}
        <div className="audit-log-section">
          <h3 className="audit-log-title">Recent Activity</h3>
          <div className="audit-log-list">
            {auditLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="audit-log-item">
                <span className="audit-action">{log.action}</span>
                <span className="audit-details">{log.details}</span>
                <span className="audit-time">{log.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="audit-log-empty">No recent activity</div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="text-warning">
                Are you sure you want to delete this {deleteType}? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete
              </button>
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
              <button onClick={() => setShowCreateUserModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
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
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateUserModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateUser} className="btn-primary">
                Create User
              </button>
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
              <button onClick={() => setShowCategoryModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCategoryModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateCategory} className="btn-primary">
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {uploadSuccess && (
                <div className="success-banner" style={{ marginBottom: '1.5rem' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Document uploaded successfully!</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Document Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select File *</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    id="file-upload-modal"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.docx,.txt"
                    className="file-input-hidden"
                  />
                  <label htmlFor="file-upload-modal" className="file-drop-label">
                    {selectedFile ? (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="file-icon-success">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-size">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="file-icon">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="file-label-text">Choose a file or drag it here</span>
                        <span className="file-hint">PDF, DOCX, TXT (Max 10MB)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categories * (Select at least one)</label>
                <div className="categories-checkbox-grid">
                  {categories.map((category) => (
                    <label key={category.id} className="category-checkbox-item">
                      <input
                        type="checkbox"
                        checked={uploadCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUploadCategories([...uploadCategories, category.id]);
                          } else {
                            setUploadCategories(uploadCategories.filter(id => id !== category.id));
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
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setUploadTitle('');
                  setUploadCategories([]);
                  setShowUploadModal(false);
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={isUploading || !selectedFile || !uploadTitle.trim() || uploadCategories.length === 0}
                className="btn-primary"
                style={{ opacity: (isUploading || !selectedFile || !uploadTitle.trim() || uploadCategories.length === 0) ? 0.5 : 1 }}
              >
                {isUploading ? (
                  <>
                    <div className="spinner-small"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditDocModal && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowEditDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Document Categories</h2>
              <button onClick={() => setShowEditDocModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Document</label>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selectedDoc.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedDoc.file_name}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categories (Select at least one)</label>
                <div className="checkbox-group">
                  {categories.map((category) => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={docCategoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDocCategoryIds([...docCategoryIds, category.id]);
                          } else {
                            setDocCategoryIds(docCategoryIds.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-muted" style={{ fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                          — {category.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditDocModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleUpdateDocumentCategories}
                disabled={docCategoryIds.length === 0}
                className="btn-primary"
                style={{ opacity: docCategoryIds.length === 0 ? 0.5 : 1 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button onClick={() => setShowEditUserModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">User</label>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selectedUser.full_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedUser.email}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="form-input"
                >
                  <option value="medewerker">Medewerker</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categories (Select at least one)</label>
                <div className="checkbox-group">
                  {categories.map((category) => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editUserCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditUserCategories([...editUserCategories, category.id]);
                          } else {
                            setEditUserCategories(editUserCategories.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-muted" style={{ fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                          — {category.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditUserModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleUpdateUser}
                disabled={editUserCategories.length === 0}
                className="btn-primary"
                style={{ opacity: editUserCategories.length === 0 ? 0.5 : 1 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div className="modal-overlay" onClick={() => setShowEditCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Category</h2>
              <button onClick={() => setShowEditCategoryModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="form-input"
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditCategoryModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleUpdateCategory}
                disabled={!editCategoryName.trim()}
                className="btn-primary"
                style={{ opacity: !editCategoryName.trim() ? 0.5 : 1 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
