import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ViewType = 'chat' | 'documents';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewType>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Documents State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategories, setUploadCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  
  // Delete Modal State
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
    if (activeView === 'documents') {
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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.trim()) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('category_ids', JSON.stringify(uploadCategories));

    try {
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setUploadSuccess(true);
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadTitle('');
        setUploadCategories([]);
        fetchDocuments();
        
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
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
    const payload = {
      title: editTitle,
      category_ids: editCategories
    };

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
        alert('Failed to update document');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error updating document');
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
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
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
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
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
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img 
            src="/images/new-concept-group-logo.jpeg" 
            alt="New Concept Group" 
            className="sidebar-logo"
          />
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveView('chat')}
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Ask Questions
          </button>

          <button
            onClick={() => setActiveView('documents')}
            className={`nav-item ${activeView === 'documents' ? 'active' : ''}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span>Documents</span>
            <span className="count-badge">{documents.length}</span>
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
          <button onClick={handleLogout} className="logout-button">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Exit
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeView === 'chat' ? (
          <div className="chat-container">
            <div className="chat-header">
              <div>
                <h1>Ask Questions</h1>
                <p>Get instant answers from our knowledge base</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2>Start a conversation</h2>
                  <p>Ask me anything about the documents in our knowledge base</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div className="message-avatar">
                        {msg.role === 'user' ? (
                          <span>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                          </svg>
                        )}
                      </div>
                      <div className="message-content">
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message assistant">
                      <div className="message-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                        </svg>
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
              <button type="submit" disabled={isLoading || !inputMessage.trim()} className="send-button">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="documents-container">
            <div className="documents-header">
              <div>
                <h1>Document Management</h1>
                <p>View and manage {user.role === 'admin' ? 'all documents' : 'your documents'}</p>
              </div>
              <button onClick={() => setShowUploadModal(true)} className="upload-button">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Document
              </button>
            </div>

            {uploadSuccess && (
              <div className="success-banner">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Document uploaded successfully!
              </div>
            )}

            <div className="search-bar">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoadingDocs ? (
              <div className="loading-state">Loading documents...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <h2>No documents found</h2>
                <p>Upload your first document to get started</p>
              </div>
            ) : (
              <div className="documents-table-container">
                <table className="documents-table">
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
                    {filteredDocuments.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className="document-cell">
                            <div className="file-icon">
                              {doc.file_type === 'pdf' ? (
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z"/>
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="doc-title">{doc.title}</div>
                              <div className="doc-filename">{doc.file_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="file-type-badge">{doc.file_type.toUpperCase()}</span>
                        </td>
                        <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="categories-cell">
                            {doc.categories && doc.categories.length > 0 ? (
                              doc.categories.map(cat => (
                                <span key={cat.id} className="category-badge">{cat.name}</span>
                              ))
                            ) : (
                              <span className="no-categories">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleEditDocument(doc)} className="action-btn edit-btn" title="Edit">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteClick(doc)} className="action-btn delete-btn" title="Delete">
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
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="close-btn">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="modal-form">
              <div className="form-group">
                <label>Document Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter document title..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Select File *</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt"
                    required
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <div className="upload-icon">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      {selectedFile ? (
                        <p className="file-name">{selectedFile.name}</p>
                      ) : (
                        <>
                          <p>Choose a file or drag it here</p>
                          <p className="file-types">PDF, DOCX, TXT (Max 10MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Categories * (Select at least one)</label>
                <div className="categories-grid">
                  {categories.map(cat => (
                    <label key={cat.id} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={uploadCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUploadCategories([...uploadCategories, cat.id]);
                          } else {
                            setUploadCategories(uploadCategories.filter(id => id !== cat.id));
                          }
                        }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="cancel-btn"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isUploading || !selectedFile || !uploadTitle.trim() || uploadCategories.length === 0}
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Document</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Categories</label>
                <div className="categories-grid">
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
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="submit-btn">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteDocument && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Document</h2>
              <button onClick={() => setShowDeleteModal(false)} className="close-btn">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteDocument.title}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmDelete} className="delete-btn-modal">
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
