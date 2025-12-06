import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, chatAPI } from '../services/api';
import type { Document } from '../types';
import { FileText, Upload, MessageSquare, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{
  question: string;
  answer: string;
  confidence: number;
  sources: any[];
  created_at: string;
} | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.list();
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || documents.length === 0) return;

    setLoading(true);
    try {
      const docIds = documents.map(d => d.id);
      const response = await chatAPI.ask(question, docIds);
      setAnswer({
        question,
        answer: response.data.answer,
        confidence: response.data.confidence,
        sources: response.data.sources,
        created_at: new Date().toISOString(),
      });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleUpload = () => {
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">H2W Knowledge Base</h1>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload size={20} />
              Upload Document
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Documents Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText size={24} />
              Documents ({documents.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No documents yet. Upload your first document!
                </p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-medium text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{doc.file_name}</p>
                    <div className="flex gap-2 mt-2">
                      {doc.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              Ask Questions
            </h2>

            <form onSubmit={handleAsk} className="mb-6">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask a question about your documents..."
                disabled={documents.length === 0}
              />
              <button
                type="submit"
                disabled={loading || !question.trim() || documents.length === 0}
                className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Thinking...' : 'Ask Question'}
              </button>
            </form>

            {answer && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">Answer:</p>
                <p className="text-gray-700">{answer.answer}</p>
                <p className="text-sm text-gray-500 mt-3">
                  Confidence: {Math.round(answer.confidence)}%
                </p>
                {answer.sources.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Sources:</p>
                    {answer.sources.map((source, i) => (
                      <p key={i} className="text-sm text-blue-600">
                        • {source.document_title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}