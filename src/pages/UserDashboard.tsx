import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'chat' | 'upload' | 'documents'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<Document | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchCategories();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeView === 'upload') {
      setUploadSuccess(false);
    } else if (activeView === 'documents') {
      fetchDocuments();
    }
  }, [activeView]);

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/documents/my-documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer || 'No response'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error.'
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.trim()) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('category_ids', JSON.stringify(selectedCategories));

    try {
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setUploadTitle('');
        setSelectedCategories([]);
        setTimeout(() => {
          setUploadSuccess(false);
          setActiveView('documents');
        }, 2000);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditTitle(doc.title);
    setEditCategories(doc.categories?.map(c => c.id) || []);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument) return;

    const token = localStorage.getItem('token');
    const payload = { title: editTitle, category_ids: editCategories };

    try {
      const response = await fetch(`${API_URL}/api/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchDocuments();
      } else {
        alert('Failed to update');
      }
    } catch (error) {
      alert('Error updating');
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setDeleteDocument(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteDocument) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/documents/${deleteDocument.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        fetchDocuments();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      alert('Error deleting');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-dashboard">
      {/* Sidebar - KEEP OLD STRUCTURE */}
      <aside className="user-sidebar">
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
            onClick={() => setActiveView('chat')}
            className={`nav-button ${activeView === 'chat' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Ask Questions
          </button>

          <button
            onClick={() => setActiveView('documents')}
            className={`nav-button ${activeView === 'documents' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            Documents
          </button>

          <button
            onClick={() => setActiveView('upload')}
            className={`nav-button ${activeView === 'upload' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user.full_name || user.email || 'User'}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content - KEEP OLD STRUCTURE */}
      <main className="user-main">
        {activeView === 'chat' && (
          <div className="chat-view">
            <div className="chat-header">
              <h1>Ask Questions</h1>
              <p>Get instant answers from our knowledge base</p>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <h2>Start a conversation</h2>
                  <p>Ask me anything about the documents</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your question..."
                disabled={isLoading}
                className="chat-input"
              />
              <button type="submit" disabled={isLoading} className="btn-send">
                Send
              </button>
            </form>
          </div>
        )}

        {activeView === 'upload' && (
          <div className="upload-view">
            <div className="upload-header">
              <h1>Upload Document</h1>
            </div>

            {uploadSuccess && (
              <div className="success-banner">Document uploaded successfully!</div>
            )}

            <form onSubmit={handleFileUpload} className="upload-form">
              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categories</label>
                <div className="category-grid">
                  {categories.map(cat => (
                    <label key={cat.id} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                          }
                        }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setActiveView('chat')} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading} className="btn-primary">
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeView === 'documents' && (
          <div className="documents-view">
            <div className="documents-header">
              <h1>My Documents</h1>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {isLoadingDocs ? (
              <div className="loading">Loading...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="empty-state">
                <h2>No documents found</h2>
                <button onClick={() => setActiveView('upload')} className="btn-primary">
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="doc-table-container">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Categories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className="doc-cell">
                            <div className="doc-title">{doc.title}</div>
                            <div className="doc-filename">{doc.file_name}</div>
                          </div>
                        </td>
                        <td><span className="type-badge">{doc.file_type}</span></td>
                        <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="cat-badges">
                            {doc.categories?.map(cat => (
                              <span key={cat.id} className="cat-badge">{cat.name}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button onClick={() => handleEditDocument(doc)} className="btn-edit" title="Edit">
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteClick(doc)} className="btn-delete" title="Delete">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Document</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Categories</label>
              <div className="category-grid">
                {categories.map(cat => (
                  <label key={cat.id} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={editCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditCategories([...editCategories, cat.id]);
                        } else {
                          setEditCategories(editCategories.filter(id => id !== cat.id));
                        }
                      }}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteDocument && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Document</h2>
            <p>Are you sure you want to delete <strong>{deleteDocument.title}</strong>?</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
