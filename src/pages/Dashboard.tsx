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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/my-documents`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await fetch(`${API_URL}/chat/ask`, {
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
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleUploadSuccess = () => {
    fetchDocuments(); // Refresh document list
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>H2W</span>
          </div>
        </div>

      <nav className="sidebar-nav">
  <a href="#chat" className="nav-item active">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
    <span>Ask Questions</span>
  </a>
  <a href="#documents" className="nav-item">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
    <span>Documents</span>
  </a>
  <a href="/admin" className="nav-item">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
    <span>Admin Panel</span>
  </a>
</nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div>
            <h1 className="page-title">Knowledge Base</h1>
            <p className="page-subtitle">Ask questions about your documents</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-upload">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload Document
          </button>
        </header>

        {/* Chat Section */}
        <section className="chat-section">
          <div className="chat-input-container">
            <form onSubmit={handleAskQuestion} className="chat-form">
              <div className="chat-input-wrapper">
                <svg className="chat-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="chat-input"
                  disabled={loading}
                />
                <button type="submit" className="chat-send-btn" disabled={loading}>
                  {loading ? (
                    <svg className="spinner-small" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Chat History */}
          <div className="chat-history">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <div className="message-question">
                  <div className="message-icon user-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="message-content">
                    <p className="message-text">{msg.question}</p>
                  </div>
                </div>

                <div className="message-answer">
                  <div className="message-icon ai-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="message-content">
                    <p className="message-text">{msg.answer}</p>
                    <div className="message-meta">
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
        </section>

        {/* Documents Grid */}
        <section className="documents-section">
          <h2 className="section-title">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            Documents ({documents.length})
          </h2>
          
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
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-action"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
