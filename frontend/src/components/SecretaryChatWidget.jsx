import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageCircle } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useSecretaryStore from '../store/secretaryStore';

const SecretaryChatWidget = () => {
  const { token } = useAuthStore();
  const { markChatAsRead, fetchRequests } = useSecretaryStore();
  
  const [patients, setPatients] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchGlobalData = async () => {
    if (!token) return;
    try {
      // 1. Fetch patients
      const resPatients = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 2. Fetch ALL messages for sorting and preview
      const resChat = await axios.get('http://localhost:8000/api/chat/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPatients(resPatients.data);
      setAllMessages(resChat.data);
    } catch (err) {
      console.error("Erreur chargement global chat", err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [token]);

  // Si on clique sur un patient, on le marque comme lu
  useEffect(() => {
    if (selectedPatient && selectedPatient.user) {
      markChatAsRead(selectedPatient.user);
    }
  }, [selectedPatient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentMessages = selectedPatient?.user 
    ? allMessages.filter(m => m.patient_user === selectedPatient.user)
    : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient || !selectedPatient.user) return;
    
    try {
      setLoading(true);
      await axios.post('http://localhost:8000/api/chat/', {
        content: newMessage,
        patient_user: selectedPatient.user,
        is_from_secretary: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchGlobalData(); // Refresh all
    } catch (err) {
      console.error("Erreur envoi message", err);
    } finally {
      setLoading(false);
    }
  };

  // Traitement de la liste des patients (Tri + Preview + Non lus)
  const lastReadState = JSON.parse(localStorage.getItem('chat_last_read') || '{}');
  
  const processedPatients = patients.map(p => {
    const pMessages = allMessages.filter(m => m.patient_user === p.user);
    const lastMsg = pMessages[pMessages.length - 1] || null;
    let unread = false;
    
    if (lastMsg && !lastMsg.is_from_secretary) {
       const readTime = lastReadState[p.user];
       if (!readTime || new Date(lastMsg.timestamp) > new Date(readTime)) {
          unread = true;
       }
    }
    
    return {
      ...p,
      lastMsg,
      unread,
      lastMsgTime: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0
    };
  });

  // Tri : Patients avec messages récents en premier, puis ceux sans messages
  processedPatients.sort((a, b) => b.lastMsgTime - a.lastMsgTime);

  const filteredPatients = processedPatients.filter(p => 
    (p.prenom + ' ' + p.nom).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex h-[75vh] animate-in fade-in">
      {/* Sidebar Patients */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-black text-slate-800 tracking-tight text-lg mb-4">Conversations</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un patient..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className={`w-full text-left p-4 flex items-start gap-3 border-b border-slate-50 transition-colors relative ${
                selectedPatient?.id === p.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-white'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                  p.user ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-300'
                }`}>
                  {p.prenom?.[0]}{p.nom?.[0]}
                </div>
                {p.unread && p.user !== selectedPatient?.user && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-center mb-0.5">
                  <p className={`font-bold text-sm truncate ${p.unread ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {p.prenom} {p.nom}
                  </p>
                  {p.lastMsg && (
                    <span className={`text-[9px] font-bold ${p.unread ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {new Date(p.lastMsg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                {p.lastMsg ? (
                  <p className={`text-xs truncate ${p.unread ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                    {p.lastMsg.is_from_secretary ? 'Vous: ' : ''}{p.lastMsg.content}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {p.user ? 'Patient Officiel' : 'Draft'}
                  </p>
                )}
              </div>
            </button>
          ))}
          {filteredPatients.length === 0 && (
             <p className="text-center text-slate-400 text-xs mt-10">Aucun patient trouvé.</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedPatient ? (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-white shadow-sm z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">{selectedPatient.prenom} {selectedPatient.nom}</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {selectedPatient.user ? 'Connecté à la messagerie' : 'Ce compte patient (Draft) ne peut pas recevoir de messages.'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4">
              {!selectedPatient.user ? (
                <div className="m-auto text-center">
                   <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-slate-500 font-bold">Messagerie indisponible</p>
                   <p className="text-xs text-slate-400 mt-1">Les patients "Draft" n'ont pas de compte pour discuter.</p>
                </div>
              ) : currentMessages.length === 0 ? (
                <p className="m-auto text-slate-400 text-sm italic font-medium">
                  Aucun message. Commencez la discussion.
                </p>
              ) : (
                currentMessages.map(msg => {
                  const isMine = msg.is_from_secretary;
                  return (
                    <div key={msg.id} className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                      isMine 
                        ? 'bg-indigo-600 text-white rounded-br-none self-end' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none self-start'
                    }`}>
                      <p className="font-medium leading-relaxed">{msg.content}</p>
                      <span className={`text-[10px] font-bold block mt-2 ${isMine ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedPatient.user && (
              <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message au patient..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !newMessage.trim()}
                  className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:scale-105"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <MessageCircle size={64} className="mb-6 opacity-20" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Messagerie MedPredict</h3>
            <p className="text-sm font-medium max-w-sm text-center">
              Sélectionnez un patient dans la liste de gauche pour afficher l'historique et commencer à discuter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretaryChatWidget;
