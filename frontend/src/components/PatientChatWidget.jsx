import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const PatientChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user, token } = useAuthStore();

  const fetchMessages = async () => {
    if (!token || !user) return;
    try {
      const res = await axios.get('http://localhost:8000/api/chat/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error("Erreur chargement messages", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Polling every 5s
      return () => clearInterval(interval);
    }
  }, [isOpen, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setLoading(true);
      await axios.post('http://localhost:8000/api/chat/', {
        content: newMessage,
        patient_user: user.id,
        is_from_secretary: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error("Erreur envoi message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <h3 className="font-bold text-sm">Secrétariat MedPredict</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 text-xs italic mt-10">
                Envoyez un message pour démarrer la discussion avec la secrétaire.
              </p>
            ) : (
              messages.map(msg => {
                const isMine = !msg.is_from_secretary;
                return (
                  <div key={msg.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isMine 
                      ? 'bg-blue-600 text-white rounded-br-none self-end' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none self-start shadow-sm'
                  }`}>
                    <p>{msg.content}</p>
                    <span className={`text-[9px] block mt-1 ${isMine ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !newMessage.trim()}
              className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform group"
        >
          <MessageCircle size={28} className="group-hover:animate-bounce" />
        </button>
      )}
    </div>
  );
};

export default PatientChatWidget;
