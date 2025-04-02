import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import remarkGfm from 'remark-gfm';

const AIQAChatApp = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await axios.post('https://ai-chatbot1-n8g8.onrender.com/api/ask', {
        question: input
      }, {
        timeout: 30000
      });
  
      const aiMessage = { 
        text: response.data.answer, 
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('API Error:', err);
      
      let errorMsg = 'Failed to get response';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error.includes('quota') 
          ? 'API limit reached' 
          : err.response.data.error;
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout';
      }
      
      setError(errorMsg);
      setMessages(prev => [...prev, { 
        text: `Error: ${errorMsg}`,
        sender: 'ai',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      margin: 0,
      padding: 0,
      backgroundColor: '#f9fafb',
      color: '#111827',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            color: '#1e40af', 
            fontWeight: '700',
            fontSize: '1.5rem',
            margin: 0
          }}>AI Knowledge Assistant</h1>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Clear Chat
            </button>
          )}
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💡</div>
                <h3 style={{ margin: '0 0 8px 0' }}>Ask me anything</h3>
                <p style={{ margin: 0, maxWidth: '300px' }}>
                  I can help answer questions, explain concepts, or assist with coding problems.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? '#1e40af' : '#f3f4f6',
                  color: msg.sender === 'user' ? 'white' : '#111827',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  maxWidth: '90%',
                  wordWrap: 'break-word',
                  border: msg.isError ? '1px solid #ef4444' : 'none'
                }}>
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              language={match[1]}
                              style={undefined}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                padding: '12px 16px',
                borderRadius: '12px 12px 12px 0',
                display: 'flex',
                gap: '8px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#1e40af',
                  animation: 'bounce 1.4s infinite ease-in-out both'
                }}></div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#1e40af',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.2s'
                }}></div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#1e40af',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.4s'
                }}></div>
              </div>
            )}
            {error && (
              <div style={{
                alignSelf: 'center',
                color: '#ef4444',
                fontSize: '0.875rem',
                padding: '8px 0'
              }}>
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.9375rem',
                marginRight: '12px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: isLoading ? '#93c5fd' : '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                minWidth: '80px'
              }}
            >
              {isLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        @media (max-width: 640px) {
          .app-container {
            padding: 12px;
            height: 100vh;
          }
          .messages {
            padding: 12px;
          }
          .input-area {
            padding: 12px;
          }
        }
        
        pre {
          background: #1e293b;
          color: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 8px 0;
        }
        
        code {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background-color: #f3f4f6;
        }
        
        blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default AIQAChatApp;