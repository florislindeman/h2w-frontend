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
            💬 Ask Questions
          </button>
          <button onClick={() => setActiveView('documents')} className={'nav-item ' + (activeView === 'documents' ? 'active' : '')}>
            📄 Documents
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
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
            ⬆️ Upload Document
          </button>
        </header>

        {activeView === 'chat' ? (
          <section className="chat-section">
            <div className="chat-input-container">
              <form onSubmit={handleAskQuestion} className="chat-form">
                <div className="chat-input-wrapper">
                  <span className="chat-input-emoji">💬</span>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask me anything about the documents..."
                    className="chat-input"
                    disabled={loading}
                  />
                  <button type="submit" className="chat-send-btn" disabled={loading}>
                    {loading ? '⏳' : '➤'}
                  </button>
                </div>
              </form>
            </div>

            {chatHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>Start a conversation</h3>
                <p>Ask me anything about the documents</p>
              </div>
            ) : (
              <div className="chat-history">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="chat-message">
                  <div className="message-question">
                    <div className="message-icon user-icon">👤</div>
                    <div className="message-content">
                      <p className="message-text">{msg.question}</p>
                    </div>
                  </div>

                  <div className="message-answer">
                    <div className="message-icon ai-icon">🤖</div>
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
            )}
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
                    🔗
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
            💬 Chat
          </button>
          <button onClick={() => setActiveView('documents')} className={'bottom-nav-item ' + (activeView === 'documents' ? 'active' : '')}>
            📄 Docs
          </button>
          <button onClick={() => setShowUpload(true)} className="bottom-nav-item">
            ⬆️ Upload
          </button>
          <button onClick={handleLogout} className="bottom-nav-item">
            🚪 Logout
          </button>
        </div>
      </nav>

      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
