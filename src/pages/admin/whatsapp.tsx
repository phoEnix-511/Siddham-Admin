import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

export default function WhatsAppInbox() {
  const { addToast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const res = await fetch('/api/admin/whatsapp');
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
  };

  const loadMessages = async (contactId: string) => {
    const res = await fetch(`/api/admin/whatsapp?contactId=${contactId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      messagesEndRef.current?.scrollIntoView();
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations();
      if (activeContact) loadMessages(activeContact.contactId);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeContact]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: activeContact.contactId, text: newMessage.trim() })
      });
      
      if (res.ok) {
        setNewMessage('');
        await loadMessages(activeContact.contactId);
        await loadConversations();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to send reply', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head><title>WhatsApp Inbox – Siddham Wellness Admin</title></Head>
      <AdminLayout title="WhatsApp Inbox">
        <div className="card" style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 600, padding: 0, overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div style={{ width: 300, borderRight: '1px solid var(--color-gray-200)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-200)', background: 'var(--color-gray-50)' }}>
              <strong>Conversations</strong>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-400)' }}>No messages yet</div>
              ) : conversations.map((c) => (
                <div 
                  key={c.contactId}
                  onClick={() => { setActiveContact(c); loadMessages(c.contactId); }}
                  style={{
                    padding: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-100)', cursor: 'pointer',
                    background: activeContact?.contactId===c.contactId ? 'var(--color-gray-50)' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--color-forest-dark)' }}>{c.contactName}</strong>
                    {c.unread > 0 && <span className="badge badge-green">{c.unread}</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.lastMessage}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 4 }}>
                    {new Date(c.lastMessageTime).toLocaleDateString()}
                  </div>
                </div>
              ))
              }
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeContact ? (
              <>
                <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-200)', background: 'var(--color-gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{activeContact.contactName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>{activeContact.contactId}</div>
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', background: '#e5ddd5' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{
                      display: 'flex', 
                      justifyContent: msg.direction === 'INBOUND' ? 'flex-start' : 'flex-end',
                      marginBottom: 16
                    }}>
                      <div style={{
                        maxWidth: '70%',
                        background: msg.direction === 'INBOUND' ? 'white' : '#dcf8c6',
                        padding: '8px 12px', borderRadius: 8,
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ wordBreak: 'break-word' }}>
                          {msg.type !== 'text' && <strong>[{msg.type}]</strong> }
                          {msg.body}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray-500)', textAlign: 'right', marginTop: 4 }}>
                          {formatDate(msg.timestamp)} &bull; {msg.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-gray-50)' }}>
                  <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message... (Must be within 24h of customer message)"
                      className="form-input"
                      style={{ flex: 1, margin: 0 }}
                      disabled={sending}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', background: '#e5ddd5' }}>
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
