import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'chat' | 'upload'>('chat');
  
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

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      
      // Redirect admin users to admin panel
      if (userData.role === 'admin') {
        navigate('/admin');
        return;
      }
      
      setUser(userData);
      fetchCategories();
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  // Reset upload success when changing views
  useEffect(() => {
    if (activeView === 'upload') {
      setUploadSuccess(false);
    }
  }, [activeView]);

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Use /chat/ask endpoint (correct backend route)
      const response = await fetch(`${API_URL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: inputMessage,  // Backend expects "question", not "query"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Sorry, ik kon je vraag niet verwerken.',
      };
      
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, er is een fout opgetreden bij het verwerken van je vraag. Zorg ervoor dat je aan minimaal één categorie bent toegewezen.',
      };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('category_ids', JSON.stringify(selectedCategories));

    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setUploadTitle('');
        setSelectedCategories([]);
        
        // Hide success banner after 3 seconds
        setTimeout(() => {
          setUploadSuccess(false);
          setActiveView('chat');
        }, 3000);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="user-dashboard">
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
            <span>Ask Questions</span>
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
        {activeView === 'chat' ? (
          <div className="chat-view">
            <div className="chat-header">
              <div>
                <h1>Ask Questions</h1>
                <p>Get instant answers from our knowledge base</p>
              </div>
              <button onClick={() => setActiveView('upload')} className="btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Document
              </button>
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
                        <div className="message-text">{msg.content}</div>
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

            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="chat-input"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="btn-send"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-view">
            <div className="upload-header">
              <h1>Upload Document</h1>
              <p>Add a new document to the knowledge base</p>
            </div>

            <div className="upload-section">
              {uploadSuccess && (
                <div className="success-banner">
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
                    id="file-input"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.docx,.txt"
                    className="file-input"
                  />
                  <label htmlFor="file-input" className="file-drop-label">
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
                          <p>Choose a file or drag it here</p>
                          <span>PDF, DOCX, TXT (Max 10MB)</span>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categories * (Select at least one)</label>
                <div className="categories-section">
                  {categories.map((category) => (
                    <div key={category.id} className="category-checkbox-item">
                      <input
                        type="checkbox"
                        id={`cat-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <label htmlFor={`cat-${category.id}`}>{category.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="upload-actions">
                <button
                  onClick={() => setActiveView('chat')}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading || !selectedFile || !uploadTitle.trim() || selectedCategories.length === 0}
                  className="btn-upload"
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
      </main>
    </div>
  );
}
