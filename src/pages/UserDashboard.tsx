import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

// Production API URL - uses environment variable from Vercel
const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';
console.log('[API] Using endpoint:', API_URL); // Debug log

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
    console.log('[CATEGORIES] Fetching categories from:', `${API_URL}/api/categories/`);
    try {
      const response = await fetch(`${API_URL}/api/categories/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('[CATEGORIES] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[CATEGORIES] Raw data:', data);
        
        // Handle different response formats
        let categoriesList = [];
        if (Array.isArray(data)) {
          categoriesList = data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesList = data.categories;
        } else if (data.data && Array.isArray(data.data)) {
          categoriesList = data.data;
        }
        
        console.log('[CATEGORIES] Processed categories:', categoriesList);
        setCategories(categoriesList);
      } else {
        console.error('[CATEGORIES] Failed to fetch:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[CATEGORIES] Error response:', errorText);
      }
    } catch (error) {
      console.error('[CATEGORIES] Exception:', error);
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
        setDocuments(data || []);
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
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      doc: '📝',
      xlsx: '📊',
      xls: '📊',
      pptx: '📊',
      ppt: '📊',
      txt: '📃',
    };
    return icons[fileType.toLowerCase()] || '📎';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="user-main">
        {/* CHAT VIEW */}
        {activeView === 'chat' && (
          <div className="chat-view">
            <div className="chat-header">
              <div>
                <h1>Ask Questions</h1>
                <p>Get instant answers from our knowledge base</p>
              </div>
            </div>

            <div className="chat-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <h3>Start a conversation</h3>
                  <p>Ask me anything about the documents</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'assistant' ? 'AI' : user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="message-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input-container">
              <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your question..."
                  disabled={isLoading}
                  className="chat-input"
                  rows={1}
                />
                <button type="submit" disabled={isLoading} className="btn-send">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {activeView === 'upload' && (
          <div className="upload-view">
            <div className="upload-header">
              <h1>Upload Document</h1>
              <p>Add new documents to the knowledge base</p>
            </div>

            <div className="upload-section">
              {uploadSuccess && (
                <div className="success-banner">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Document uploaded successfully!
                </div>
              )}

              <form onSubmit={handleFileUpload}>
                <div className="file-drop-zone">
                  <label htmlFor="file-upload" className="file-drop-label">
                    {selectedFile ? (
                      <div className="selected-file">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="file-info">
                          <p>{selectedFile.name}</p>
                          <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="file-info">
                          <p>Click to upload or drag and drop</p>
                          <span>PDF, DOCX, XLSX (max. 50MB)</span>
                        </div>
                      </>
                    )}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="file-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter document title"
                    required
                  />
                </div>

                <div className="categories-section">
                  <label className="form-label">Categories (Select at least one)</label>
                  {categories.length === 0 ? (
                    <div className="error-message" style={{marginTop: '0.5rem'}}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>No categories available. Please contact your administrator.</span>
                    </div>
                  ) : (
                    categories.map(cat => (
                      <label key={cat.id} className="category-checkbox-item">
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
                        <label>{cat.name}</label>
                      </label>
                    ))
                  )}
                </div>

                <div className="upload-actions">
                  <button type="button" onClick={() => setActiveView('documents')} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUploading} className="btn-upload">
                    {isUploading && <div className="spinner-small" />}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DOCUMENTS VIEW - ADMIN STYLE */}
        {activeView === 'documents' && (
          <div className="admin-documents-view">
            <header className="admin-header">
              <div>
                <h1 className="admin-title">My Documents</h1>
                <p className="admin-subtitle">View and manage your documents</p>
              </div>
              <button onClick={() => setActiveView('upload')} className="btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Document
              </button>
            </header>

            {isLoadingDocs ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <h3>No documents found</h3>
                <p>Upload your first document to get started</p>
                <button onClick={() => setActiveView('upload')} className="btn-primary">
                  Upload Document
                </button>
              </div>
            ) : (
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
                          <span className="type-badge">{doc.file_type.toUpperCase()}</span>
                        </td>
                        <td>{new Date(doc.upload_date).toLocaleDateString('nl-NL')}</td>
                        <td>
                          <div className="category-pills">
                            {doc.categories && doc.categories.length > 0 ? (
                              doc.categories.map((cat) => (
                                <span key={cat.id} className="category-pill">{cat.name}</span>
                              ))
                            ) : (
                              <span className="text-muted">No categories</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEditDocument(doc)}
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
                              onClick={() => handleDeleteClick(doc)}
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
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Document</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categories</label>
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
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteDocument && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Document</h2>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteDocument.title}</strong>?</p>
              <p className="text-muted" style={{marginTop: '0.5rem'}}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
