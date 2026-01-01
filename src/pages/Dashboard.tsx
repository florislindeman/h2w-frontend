import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadModal from './UploadModal';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

interface Document {
  id: string;
  title: string;
  file_type: string;
  upload_date: string;
  file_url: string;
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'documents'>('chat');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_URL + '/documents/my-documents', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(API_URL + '/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
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
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
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

  const iconStyle = { width: '20px', height: '20px', flexShrink: 0 };
  const logoutIconStyle = { width: '16px', height: '16px' };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/images/new-concept-group-logo.jpeg" alt="New Concept Group" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveView('chat')} className={'nav-item ' + (activeView === 'chat' ? 'active' : '')}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>Ask Questions</span>
          </button>
          <button onClick={() => setActiveView('documents')} className={'nav-item ' + (activeView === 'documents' ? 'active' : '')}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span>Documents</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <svg viewBox="0 0 20 20" fill="currentColor" style={logoutIconStyle}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1 className="page-title">{activeView === 'chat' ? 'Ask Questions' : 'My Documents'}</h1>
            <p className="page-subtitle">{activeView === 'chat' ? 'Get instant answers from our knowledge base' : 'View and manage your documents'}</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-upload">
            <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload Document
          </button>
        </header>

        {activeView === 'chat' ? (
          <section className="chat-section">
            <div className="chat-input-container">
              <form onSubmit={handleAskQuestion} className="chat-form">
                <div className="chat-input-wrapper">
                  <svg className="chat-icon" viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question..."
                    className="chat-input"
                    disabled={loading}
                  />
                  <button type="submit" className="chat-send-btn" disabled={loading}>
                    {loading ? (
                      <svg className="spinner-small" viewBox="0 0 24 24" style={iconStyle}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="chat-history">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="chat-message">
                  <div className="message-question">
                    <div className="message-icon user-icon">
                      <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="message-content">
                      <p className="message-text">{msg.question}</p>
                    </div>
                  </div>

                  <div className="message-answer">
                    <div className="message-icon ai-icon">
                      <svg viewBox="0 0 20 20" fill="currentColor" style={iconStyle}>
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="message-content">
                      <p className="message-text">{msg.answer}</p>
                      <div className="message-meta">
                        <span className={'confidence-badge ' + (msg.confidence > 70 ? 'high' : msg.confidence > 40 ? 'medium' : 'low')}>
                          {msg.confidence}% confidence
                        </span>
                        {msg.sources.length > 0 && (
                          <div className="sources">
                            <span className="sources-label">Sources:</span>
                            {msg.sources.map((source, i) => (
                              <a key={i} href={source.document_url} target="_blank" rel="noopener noreferrer" className="source-pill">
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
          </section>
        ) : (
          <section className="documents-section">
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-icon-wrapper">
                    <span className="document-emoji">{getFileIcon(doc.file_type)}</span>
                  </div>
                  <div className="document-info">
                    <h3 className="document-title">{doc.title}</h3>
                    <p className="document-meta">
                      {doc.file_type.toUpperCase()} • {new Date(doc.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="document-action">
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <button onClick={() => setActiveView('chat')} className={'bottom-nav-item ' + (activeView === 'chat' ? 'active' : '')}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>Chat</span>
          </button>
          <button onClick={() => setActiveView('documents')} className={'bottom-nav-item ' + (activeView === 'documents' ? 'active' : '')}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span>Docs</span>
          </button>
          <button onClick={() => setShowUpload(true)} className="bottom-nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>Upload</span>
          </button>
          <button onClick={handleLogout} className="bottom-nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
