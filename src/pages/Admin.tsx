import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import './DashboardChat.css';

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

interface ChatMessage {
  question: string;
  answer: string;
  confidence: number;
  sources: Array<{
    document_title: string;
    document_url: string;
  }>;
}

type TabType = 'chat' | 'documents' | 'users' | 'categories';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Chat state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategories, setUploadCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
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

  const [showEditDocModal, setShowEditDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docCategoryIds, setDocCategoryIds] = useState<string[]>([]);

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserCategories, setEditUserCategories] = useState<string[]>([]);
  const [editUserRole, setEditUserRole] = useState<string>('medewerker');

  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');

  const checkAuth = (response: Response) => {
    if (response.status === 401) {
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
      setIsAdmin(user.role === 'admin');
    } catch (e) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const userIsAdmin = user.role === 'admin';
      
      try {
        const docsRes = await fetch(API_URL + '/api/documents/', {
          headers: { 
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
        });
        
        if (!checkAuth(docsRes)) return;
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }

      if (userIsAdmin) {
        try {
          const usersRes = await fetch(API_URL + '/api/users/', {
            headers: { 
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
          });
          
          if (!checkAuth(usersRes)) return;
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }

        try {
          const catsRes = await fetch(API_URL + '/api/categories/', {
            headers: { 
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
          });
          
          if (!checkAuth(catsRes)) return;
          if (catsRes.ok) {
            const catsData = await catsRes.json();
            setCategories(catsData);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setChatLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setChatHistory([
        { 
          question, 
          answer: data.answer, 
          confidence: data.confidence,
          sources: data.sources || []
        },
        ...chatHistory
      ]);
      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadTitle.trim() || uploadCategories.length === 0) {
      alert('Please select file, title, and at least one category');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('category_ids', JSON.stringify(uploadCategories));

    try {
      const response = await fetch(API_URL + '/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setUploadTitle('');
        setUploadCategories([]);
        await fetchData();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_URL + '/api/documents/' + doc.id + '/download', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = () => {
    if (deleteType === 'document') handleDeleteDocument(deleteTarget?.id);
    else if (deleteType === 'user') handleDeleteUser(deleteTarget?.id);
    else if (deleteType === 'category') handleDeleteCategory(deleteTarget?.id);
  };

  const handleDeleteDocument = async (docId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/documents/' + docId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      setDocuments(documents.filter(d => d.id !== docId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/users/' + userId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      setUsers(users.filter(u => u.id !== userId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/categories/' + categoryId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      setCategories(categories.filter(c => c.id !== categoryId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_URL + '/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(newUser),
      });
      if (response.ok) {
        setShowCreateUserModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_URL + '/api/categories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(newCategory),
      });
      if (response.ok) {
        setShowCategoryModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Create category error:', error);
    }
  };

  const handleUpdateDocumentCategories = async () => {
    if (!selectedDoc) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/documents/' + selectedDoc.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ category_ids: docCategoryIds }),
      });
      await fetchData();
      setShowEditDocModal(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/users/' + selectedUser.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ role: editUserRole, category_ids: editUserCategories }),
      });
      await fetchData();
      setShowEditUserModal(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(API_URL + '/api/categories/' + selectedCategory.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ name: editCategoryName, description: editCategoryDescription }),
      });
      await fetchData();
      setShowEditCategoryModal(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      pdf: '📄', docx: '📝', xlsx: '📊', pptx: '📊', txt: '📃',
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
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/images/new-concept-group-logo.jpeg" alt="New Concept Group" className="ncg-logo-image" />
          </div>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('chat')} className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>Ask Questions</span>
          </button>
          <button onClick={() => setActiveTab('documents')} className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span>Documents</span>
            <span className="badge">{documents.length}</span>
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('users')} className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Users</span>
                <span className="badge">{users.length}</span>
              </button>
              <button onClick={() => setActiveTab('categories')} className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span>Categories</span>
                <span className="badge">{categories.length}</span>
              </button>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">
              {activeTab === 'chat' && 'Ask Questions'}
              {activeTab === 'documents' && 'Document Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'categories' && 'Category Management'}
            </h1>
            <p className="admin-subtitle">
              {activeTab === 'chat' && 'Get instant answers from our knowledge base'}
              {activeTab === 'documents' && 'View and manage all documents'}
              {activeTab === 'users' && 'Manage user roles and permissions'}
              {activeTab === 'categories' && 'Organize content with categories'}
            </p>
          </div>
          {activeTab === 'documents' && isAdmin && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload Document
            </button>
          )}
          {activeTab === 'users' && isAdmin && (
            <button onClick={() => setShowCreateUserModal(true)} className="btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              New User
            </button>
          )}
          {activeTab === 'categories' && isAdmin && (
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
            {activeTab === 'chat' && (
              <div className="chat-section">
                <div className="chat-input-container">
                  <form onSubmit={handleAskQuestion} className="chat-form-admin">
                    <div className="chat-input-wrapper-admin">
                      <svg className="chat-icon-admin" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask me anything about the documents..."
                        className="chat-input-admin"
                        disabled={chatLoading}
                      />
                      <button type="submit" className="chat-send-btn-admin" disabled={chatLoading}>
                        {chatLoading ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {chatHistory.length === 0 ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h3>Start a conversation</h3>
                    <p>Ask me anything about the documents</p>
                  </div>
                ) : (
                  <div className="chat-history-admin">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className="chat-message-admin">
                        <div className="message-question-admin">
                          <div className="message-icon-admin user-icon">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="message-content-admin">
                            <p className="message-text-admin">{msg.question}</p>
                          </div>
                        </div>

                        <div className="message-answer-admin">
                          <div className="message-icon-admin ai-icon">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="message-content-admin">
                            <p className="message-text-admin">{msg.answer}</p>
                            <div className="message-meta-admin">
                              <span className={`confidence-badge ${msg.confidence > 70 ? 'high' : msg.confidence > 40 ? 'medium' : 'low'}`}>
                                {msg.confidence}% confidence
                              </span>
                              {msg.sources.length > 0 && (
                                <div className="sources">
                                  <span className="sources-label">Sources:</span>
                                  {msg.sources.map((source, i) => (
                                    <a 
                                      key={i} 
                                      href={source.document_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="source-pill"
                                    >
                                      {source.document_title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>DOCUMENT</th><th>TYPE</th><th>UPLOAD DATE</th><th>CATEGORIES</th><th>ACTIONS</th></tr>
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
                        <td><span className="type-badge">{doc.file_type}</span></td>
                        <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="category-pills">
                            {doc.categories?.map((cat) => (<span key={cat.id} className="category-pill">{cat.name}</span>)) || <span className="text-muted">No categories</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {isAdmin && (
                              <button onClick={() => { setSelectedDoc(doc); setDocCategoryIds(doc.categories?.map(c => c.id) || []); setShowEditDocModal(true); }} className="btn-icon btn-edit">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                              </button>
                            )}
                            <button onClick={() => handleDownloadDocument(doc)} className="btn-icon btn-download">
                              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                            {isAdmin && (
                              <button onClick={() => { setDeleteTarget(doc); setDeleteType('document'); setShowDeleteModal(true); }} className="btn-icon btn-delete">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && isAdmin && (
              <>
                <div className="filter-bar">
                  <div className="search-box">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                  </div>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="medewerker">Medewerker</option>
                  </select>
                  <span className="filter-info">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead><tr><th>USER</th><th>EMAIL</th><th>ROLE</th><th>CATEGORIES</th><th>ACTIONS</th></tr></thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td><div className="user-cell"><div className="user-avatar">{user.full_name.charAt(0).toUpperCase()}</div><div>{user.full_name}</div></div></td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <div className="category-pills">
                              {user.categories?.map((cat) => <span key={cat.id} className="category-pill">{cat.name}</span>) || <span className="text-muted">No categories</span>}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => { setSelectedUser(user); setEditUserRole(user.role); setEditUserCategories(user.categories?.map(c => c.id) || []); setShowEditUserModal(true); }} className="btn-icon btn-edit">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                              </button>
                              <button onClick={() => { setDeleteTarget(user); setDeleteType('user'); setShowDeleteModal(true); }} className="btn-icon btn-delete">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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

            {activeTab === 'categories' && isAdmin && (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-header">
                      <h3>{category.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => { setSelectedCategory(category); setEditCategoryName(category.name); setEditCategoryDescription(category.description || ''); setShowEditCategoryModal(true); }} className="btn-icon-small btn-edit">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => { setDeleteTarget(category); setDeleteType('category'); setShowDeleteModal(true); }} className="btn-icon-small btn-delete">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                    {category.description && <p className="category-description">{category.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <button onClick={() => setActiveTab('chat')} className={`bottom-nav-item ${activeTab === 'chat' ? 'active' : ''}`}>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
            <span>Chat</span>
          </button>
          <button onClick={() => setActiveTab('documents')} className={`bottom-nav-item ${activeTab === 'documents' ? 'active' : ''}`}>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
            <span>Docs</span>
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('users')} className={`bottom-nav-item ${activeTab === 'users' ? 'active' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                <span>Users</span>
              </button>
              <button onClick={() => setActiveTab('categories')} className={`bottom-nav-item ${activeTab === 'categories' ? 'active' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span>Cats</span>
              </button>
            </>
          )}
          <button onClick={handleLogout} className="bottom-nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Modal voor document upload, delete, edit, etc blijven hetzelfde */}
      {showUploadModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {uploadSuccess && (
                <div className="success-banner">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Document uploaded successfully!
                </div>
              )}
              <div className="file-drop-zone">
                <label htmlFor="file-upload" className="file-drop-label">
                  {selectedFile ? (
                    <div className="selected-file">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <div className="file-info">
                        <p>{selectedFile.name}</p>
                        <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      <div className="file-info">
                        <p>Click to upload or drag and drop</p>
                        <span>PDF, DOCX, XLSX (max. 50MB)</span>
                      </div>
                    </>
                  )}
                </label>
                <input id="file-upload" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="file-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="form-input" placeholder="Enter document title" />
              </div>
              <div className="categories-section">
                <label className="form-label">Categories (Select at least one)</label>
                {categories.map(cat => (
                  <label key={cat.id} className="category-checkbox-item">
                    <input type="checkbox" checked={uploadCategories.includes(cat.id)} onChange={(e) => { if (e.target.checked) { setUploadCategories([...uploadCategories, cat.id]); } else { setUploadCategories(uploadCategories.filter(id => id !== cat.id)); } }} />
                    <label>{cat.name}</label>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleFileUpload} disabled={isUploading} className="btn-primary">{isUploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-modal-content">
                <div className="delete-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </div>
                <h3>Are you sure?</h3>
                <p>This action cannot be undone. This will permanently delete the {deleteType}{deleteType === 'document' && ' "' + (deleteTarget?.title || '') + '"'}{deleteType === 'user' && ' "' + (deleteTarget?.full_name || '') + '"'}{deleteType === 'category' && ' "' + (deleteTarget?.name || '') + '"'}.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showEditDocModal && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowEditDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Document Categories</h2>
              <button onClick={() => setShowEditDocModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Document:</strong> {selectedDoc.title}</p>
              <div className="form-group">
                <label className="form-label">Categories</label>
                {categories.map(cat => (
                  <label key={cat.id} className="checkbox-label">
                    <input type="checkbox" checked={docCategoryIds.includes(cat.id)} onChange={(e) => { if (e.target.checked) { setDocCategoryIds([...docCategoryIds, cat.id]); } else { setDocCategoryIds(docCategoryIds.filter(id => id !== cat.id)); } }} />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditDocModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleUpdateDocumentCategories} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => setShowEditUserModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {selectedUser.full_name}</p>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)} className="form-input">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="medewerker">Medewerker</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categories</label>
                {categories.map(cat => (
                  <label key={cat.id} className="checkbox-label">
                    <input type="checkbox" checked={editUserCategories.includes(cat.id)} onChange={(e) => { if (e.target.checked) { setEditUserCategories([...editUserCategories, cat.id]); } else { setEditUserCategories(editUserCategories.filter(id => id !== cat.id)); } }} />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditUserModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleUpdateUser} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button onClick={() => setShowCreateUserModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} className="form-input" placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="form-input" placeholder="Enter email" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="form-input" placeholder="Enter password" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="form-input">
                  <option value="medewerker">Medewerker</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categories</label>
                {categories.map(cat => (
                  <label key={cat.id} className="checkbox-label">
                    <input type="checkbox" checked={newUser.category_ids.includes(cat.id)} onChange={(e) => { if (e.target.checked) { setNewUser({...newUser, category_ids: [...newUser.category_ids, cat.id]}); } else { setNewUser({...newUser, category_ids: newUser.category_ids.filter(id => id !== cat.id)}); } }} />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateUserModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateUser} className="btn-primary">Create User</button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Category</h2>
              <button onClick={() => setShowCategoryModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} className="form-input" placeholder="Enter category name" />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input type="text" value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} className="form-input" placeholder="Enter description" />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCategoryModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateCategory} className="btn-primary">Create Category</button>
            </div>
          </div>
        </div>
      )}

      {showEditCategoryModal && selectedCategory && (
        <div className="modal-overlay" onClick={() => setShowEditCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Category</h2>
              <button onClick={() => setShowEditCategoryModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" value={editCategoryDescription} onChange={(e) => setEditCategoryDescription(e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditCategoryModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleUpdateCategory} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
