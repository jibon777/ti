import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [usersDb, setUsersDb] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', assignee_id: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [commentText, setCommentText] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) { setUser(data.user); fetchData(); } 
    else alert(data.message);
  };

  const fetchData = () => {
    fetch('/api/tickets').then(res => res.json()).then(data => {
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    fetch('/api/users').then(res => res.json()).then(setUsersDb);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTicket, status: 'To Do' })
    });
    setShowCreateModal(false);
    setNewTicket({ title: '', description: '', assignee_id: '' });
    fetchData();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: user.name, text: commentText })
    });

    const data = await res.json();
    if (data.success) {
      setCommentText('');
      fetchData();
    } else {
      alert(data.error || 'Gagal menambahkan komentar');
    }
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert("Hanya file gambar yang diperbolehkan!");
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const loadingText = "\n[Mengupload gambar...]\n";
        setNewTicket(prev => ({ ...prev, description: prev.description + loadingText }));

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.imageUrl) {
            setNewTicket(prev => ({
                ...prev,
                description: prev.description.replace(loadingText, `\n\n${data.imageUrl}\n\n`)
            }));
        }
    } catch (err) {
        alert('Gagal mengupload gambar');
    }
  };

  const onDragStartTicket = (e, ticket) => {
    if (ticket.status === 'Done') {
        e.preventDefault();
        alert('⚠️ Tiket "Done" tidak dapat dipindahkan.');
        return;
    }
    e.dataTransfer.setData('ticketId', ticket.id);
  };

  const onDropTicket = async (e, newStatus) => {
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;
    const res = await fetch(`/api/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, user_name: user.name })
    });
    const result = await res.json();
    if(result.error) alert(result.error);
    fetchData();
  };

  const renderTextWithImages = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)|(?:\/uploads\/[^\s]+))/gi;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
        if (part && part.match(urlRegex)) {
             return (
              <img 
                key={index} 
                src={part} 
                alt="Attachment" 
                className="max-w-full max-h-60 object-contain my-2 rounded shadow border cursor-pointer hover:opacity-90 block" 
                onClick={() => window.open(part, '_blank')} 
              />
            );
        }
        return <span key={index}>{part}</span>;
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Jira Clone Login</h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" name="email" defaultValue="budi@example.com" className="w-full border p-2 rounded" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input type="password" name="password" defaultValue="password123" className="w-full border p-2 rounded" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Masuk</button>
        </form>
      </div>
    );
  }

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🎫 Internal Ticketing Board</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Halo, <strong>{user.name}</strong></span>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
            + Buat Tiket Baru
          </button>
          <button onClick={() => setUser(null)} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-grow overflow-hidden">
        {columns.map(status => (
          <div key={status} className="bg-gray-200 p-4 rounded-lg flex flex-col overflow-y-auto max-h-[80vh]" onDragOver={e => e.preventDefault()} onDrop={(e) => onDropTicket(e, status)}>
            <h2 className="font-bold text-gray-700 mb-4 uppercase sticky top-0 bg-gray-200 z-10 pb-2 border-b-2 border-gray-300">
              {status} ({tickets.filter(t => t.status === status).length})
            </h2>
            {tickets.filter(t => t.status === status).map(ticket => {
              const isDone = ticket.status === 'Done';
              return (
                <div key={ticket.id} draggable={!isDone} onDragStart={(e) => onDragStartTicket(e, ticket)} onClick={() => setSelectedTicket(ticket)}
                  className={`${isDone ? 'bg-green-50' : 'bg-white'} p-4 rounded shadow mb-3 border ${!isDone ? 'cursor-grab hover:ring-2 hover:ring-blue-300' : 'cursor-pointer'} transition flex flex-col gap-2`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${isDone ? 'text-green-800 line-through' : 'text-gray-800'}`}>{ticket.title}</h3>
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1 rounded border">#{ticket.id}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* MODAL: DETAIL TIKET, DISKUSI KOMENTAR & ACTIVITY LOG */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className={`p-4 border-b flex justify-between items-center rounded-t-lg ${selectedTicket.status === 'Done' ? 'bg-green-100' : 'bg-blue-50'}`}>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">#{selectedTicket.id} - {selectedTicket.status}</span>
                <h2 className="text-2xl font-bold">{selectedTicket.title}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-red-500 font-bold text-xl px-2">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow flex flex-col md:flex-row gap-6">
                <div className="flex-grow w-full md:w-2/3 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Deskripsi / Detail</h3>
                        <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap min-h-[120px]">
                            {renderTextWithImages(selectedTicket.description)}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-3">💬 Diskusi & Catatan Penerima</h3>
                        <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-2">
                            {(() => {
                                let comments = [];
                                try { comments = JSON.parse(selectedTicket.comments || '[]'); } catch(e){}
                                if (comments.length === 0) return <p className="text-gray-400 italic text-sm">Belum ada komentar.</p>;

                                return comments.map((c, idx) => {
                                    const isMe = c.user === user.name;
                                    return (
                                        <div key={idx} className={`p-3 rounded-lg border text-sm ${isMe ? 'bg-blue-50 border-blue-200 ml-6' : 'bg-gray-50 border-gray-200 mr-6'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-bold ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>{c.user}</span>
                                                <span className="text-[10px] text-gray-400">{formatDate(c.time)}</span>
                                            </div>
                                            <p className="text-gray-800 whitespace-pre-wrap">{c.text}</p>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-grow border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Tulis catatan/kendala jika tiket tidak sesuai..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 shadow">
                                Kirim
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="w-full md:w-1/3 flex flex-col gap-4 border-l pl-4">
                    <div className="bg-blue-50 p-4 rounded border border-blue-100">
                        <p className="text-sm text-gray-600 mb-1">Assignee:</p>
                        <p className="font-bold text-blue-800">👤 {selectedTicket.assignee || 'Unassigned'}</p>
                    </div>

                    <div className="flex-grow">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700">Activity Log</h3>
                        <div className="bg-gray-50 p-3 rounded border text-xs text-gray-600 max-h-[350px] overflow-y-auto">
                            {(() => {
                                let logs = [];
                                try { logs = JSON.parse(selectedTicket.logs || '[]'); } catch(e){}
                                if (logs.length === 0) return <p className="text-gray-400 italic">Belum ada aktivitas.</p>;

                                return (
                                    <ul className="list-disc pl-4 space-y-2">
                                        {logs.map((log, idx) => (
                                            <li key={idx}>
                                                <span className="font-semibold text-gray-800">{log.action}</span> oleh <b className="text-blue-700">{log.user}</b><br/>
                                                <span className="text-[10px] text-gray-400">{formatDate(log.time)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4 border-t flex justify-end">
                <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT TIKET BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Buat Tiket Baru</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Judul Tiket</label>
                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required
                  value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} />
              </div>
              
              <div className="mb-4 relative">
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Deskripsi (*Drag & Drop* gambar langsung ke kotak ini)
                </label>
                <textarea 
                  className={`w-full border-2 p-2 rounded outline-none transition-all duration-200 
                              ${isDraggingFile ? 'border-blue-500 bg-blue-50 border-dashed' : 'border-gray-200 focus:ring-2 focus:ring-blue-400'}`} 
                  rows="4" required
                  placeholder="Detailkan pekerjaan. Tarik file gambar dari komputer ke kotak ini..."
                  value={newTicket.description} 
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleImageDrop}
                />
                {isDraggingFile && (
                    <div className="absolute inset-0 top-6 flex items-center justify-center pointer-events-none rounded bg-white bg-opacity-80">
                        <span className="font-bold text-blue-600 text-lg">Lepaskan Gambar Di Sini!</span>
                    </div>
                )}
              </div>

              {newTicket.description && (
                <div className="mb-4 p-3 bg-gray-50 border rounded">
                  <span className="text-xs font-bold text-gray-500 uppercase block mb-1">
                    📷 Pratinjau Teks & Gambar:
                  </span>
                  <div className="text-sm whitespace-pre-wrap">
                    {renderTextWithImages(newTicket.description)}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1 text-gray-700">Tugaskan Kepada (Assignee)</label>
                <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                  value={newTicket.assignee_id} onChange={e => setNewTicket({...newTicket, assignee_id: e.target.value})}>
                  <option value="">-- Pilih Anggota Tim --</option>
                  {usersDb.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 shadow">Simpan Tiket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;