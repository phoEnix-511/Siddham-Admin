import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

function formatMessageDateTime(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export default function WhatsAppInbox() {
  const { addToast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const res = await fetch('/api/admin/whatsapp');
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
  };

  const loadMessages = async (contactId: string) => {
    const res = await fetch(`/api/admin/whatsapp?contactId=${contactId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleDeleteChat = async () => {
    if (!activeContact) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete all messages for ${activeContact.contactName || activeContact.contactId}?`);
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/whatsapp?contactId=${encodeURIComponent(activeContact.contactId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages([]); // Clears chat history while keeping the contact active
        addToast('Chat history deleted', 'success');
        await loadConversations();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to delete chat', 'error');
      }
    } catch {
      addToast('Error deleting chat', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportContacts = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/whatsapp?exportContacts=true');
      if (!res.ok) throw new Error('Failed to fetch contact list');
      const data = await res.json();
      const contacts: any[] = data.contacts || [];

      if (contacts.length === 0) {
        addToast('No contacts available to export', 'info');
        return;
      }

      // Convert contacts to CSV
      const headers = ['Phone Number', 'Name', 'Total Messages', 'Last Activity'];
      const rows = contacts.map(c => [
        `"${c.phone}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        c.messageCount,
        `"${new Date(c.lastActivity).toLocaleString('en-IN')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `whatsapp_marketing_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Exported ${contacts.length} marketing contacts`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Head><title>WhatsApp Inbox – Siddham Wellness Admin</title></Head>
      <AdminLayout title="WhatsApp Inbox">
        {/* Fullscreen Image Preview Modal */}
        {previewImage && (
          <div 
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, cursor: 'pointer'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute', top: -40, right: 0,
                  background: 'white', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, fontSize: '1.2rem', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 10000
                }}
                title="Close"
              >
                ✕
              </button>
              <img 
                src={previewImage} 
                alt="Enlarged preview" 
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
              />
            </div>
          </div>
        )}

        <div className="card" style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 600, padding: 0, overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div style={{ width: 320, borderRight: '1px solid var(--color-gray-200)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-gray-200)', background: 'var(--color-gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Conversations ({conversations.length})</strong>
              <button
                onClick={handleExportContacts}
                disabled={exporting}
                className="btn btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--color-forest-dark)', color: 'white' }}
                title="Export all customer numbers for marketing"
              >
                {exporting ? 'Exporting...' : '📥 Export List'}
              </button>
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
                    <strong style={{ color: 'var(--color-forest-dark)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contactName}
                    </strong>
                    {c.unread > 0 && <span className="badge badge-green">{c.unread}</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.direction === 'OUTBOUND' && <span style={{ color: 'var(--color-gray-400)' }}>You: </span>}
                    {c.lastMessage}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 4 }}>
                    {formatMessageDateTime(c.lastMessageTime)}
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
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-gray-200)', background: 'var(--color-gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{activeContact.contactName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>{activeContact.contactId}</div>
                  </div>
                  <button
                    onClick={handleDeleteChat}
                    disabled={deleting}
                    className="btn btn-sm btn-outline"
                    style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: '0.75rem', padding: '4px 10px' }}
                    title="Delete chat history for this contact"
                  >
                    {deleting ? 'Deleting...' : '🗑️ Delete Chat'}
                  </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', background: '#e5ddd5' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginTop: '20%' }}>
                      No messages in this chat. Send a message below!
                    </div>
                  ) : messages.map((msg) => (
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
                        {/* Media display */}
                        {msg.mediaUrl && (
                          <div style={{ marginBottom: 8 }}>
                            {msg.type === 'image' && (
                              <img 
                                src={`/api/admin/whatsapp/media?mediaId=${msg.mediaUrl}`} 
                                alt="WhatsApp media"
                                onClick={() => setPreviewImage(`/api/admin/whatsapp/media?mediaId=${msg.mediaUrl}`)}
                                style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 6, display: 'block', cursor: 'pointer' }}
                                title="Click to enlarge"
                              />
                            )}
                            {msg.type === 'video' && (
                              <video 
                                controls 
                                src={`/api/admin/whatsapp/media?mediaId=${msg.mediaUrl}`} 
                                style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 6 }} 
                              />
                            )}
                            {msg.type === 'audio' && (
                              <audio 
                                controls 
                                src={`/api/admin/whatsapp/media?mediaId=${msg.mediaUrl}`} 
                                style={{ width: '100%' }} 
                              />
                            )}
                            {(msg.type === 'document' || (!['image', 'video', 'audio'].includes(msg.type))) && (
                              <a 
                                href={`/api/admin/whatsapp/media?mediaId=${msg.mediaUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: 'rgba(0,0,0,0.05)', padding: '6px 12px',
                                  borderRadius: 6, textDecoration: 'none', color: '#128c7e',
                                  fontWeight: 600, fontSize: '0.85rem'
                                }}
                              >
                                📄 View Document / File
                              </a>
                            )}
                          </div>
                        )}
                        <div style={{ wordBreak: 'break-word' }}>
                          {msg.type !== 'text' && !msg.mediaUrl && <strong>[{msg.type}] </strong>}
                          {msg.body}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray-500)', textAlign: 'right', marginTop: 4 }}>
                          {formatMessageDateTime(msg.timestamp)} &bull; {msg.status}
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
