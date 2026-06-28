import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, MessageCircle, Stethoscope, Brain, Trash2,
  ChevronRight, Sparkles, User, Copy, Check, RefreshCw, Mic, MicOff
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { getRelativeTime, truncate } from '../lib/utils';
import toast from 'react-hot-toast';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const QUICK_PROMPTS = [
  "I have a headache and fever since yesterday",
  "Explain my blood pressure readings",
  "What are side effects of Metformin?",
  "Help me prepare for my doctor visit",
  "What foods should I avoid with diabetes?",
  "I'm feeling anxious and stressed lately",
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

export default function ChatPage() {
  const { profile } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();

  useEffect(() => { loadConversations(); }, []);
  
  useEffect(() => { 
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations');
    } finally {
      setLoadingConvs(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await api.post('/chat/conversations', { title: 'New Conversation' });
      const conv = res.data.conversation;
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch {
      toast.error('Failed to create conversation');
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(res.data.messages || []);
      setActiveConvId(convId);
      setSidebarOpen(false);
    } catch {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText) return;

    if (isListening) stopListening();

    let convId = activeConvId;
    if (!convId) {
      const res = await api.post('/chat/conversations', { title: messageText.substring(0, 50) });
      convId = res.data.conversation.id;
      setActiveConvId(convId);
      setConversations(prev => [res.data.conversation, ...prev]);
    }

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: messageText }]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('carebot_token');
      const response = await fetch(`http://localhost:5000/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageText })
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let aiMessageId = 'ai-' + Date.now();
      let aiContent = '';
      
      // Remove temp user message, it will be added back with actual ID in metadata
      setMessages(prev => prev.filter(m => m.id !== tempId));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const events = chunkStr.split('\n\n').filter(Boolean);
        
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') {
              setIsTyping(false);
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'metadata') {
                aiMessageId = data.aiMessageId;
                setMessages(prev => [
                  ...prev, 
                  { ...data.userMessage, created_at: new Date().toISOString() },
                  { id: aiMessageId, role: 'assistant', content: '' }
                ]);
                setIsTyping(false);
              } else if (data.type === 'chunk') {
                aiContent += data.chunk;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: aiContent } : m));
              } else if (data.type === 'action') {
                toast.success(data.message);
              } else if (data.type === 'error') {
                toast.error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      await loadConversations();
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(err.message || 'Failed to send message');
      setIsTyping(false);
    }
  }, [activeConvId, input, isListening, stopListening]);

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied!');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed lg:relative top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-30 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <button onClick={createNewConversation}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> New Conversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingConvs ? (
                [...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <motion.div
                    key={conv.id}
                    whileHover={{ x: 2 }}
                    onClick={() => loadMessages(conv.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition-all ${
                      activeConvId === conv.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageCircle className={`w-5 h-5 flex-shrink-0 ${activeConvId === conv.id ? 'text-blue-500' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${activeConvId === conv.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {truncate(conv.title, 28)}
                      </p>
                      <p className="text-xs text-slate-400">{getRelativeTime(conv.updated_at)}</p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Chat Header */}
        <div className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex-shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">AI Health Assistant</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Online · Ready to help</p>
            </div>
          </div>
          {activeConvId && (
            <button onClick={() => { setActiveConvId(null); setMessages([]); }}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-800 shadow-glow-sm">
                <Brain className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">
                Hello, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                I'm your AI Health Assistant. I can help with symptom analysis, medication questions,
                appointment scheduling, and interpreting your health data.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-sm hover:scale-[1.02] group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      {prompt}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600'
              }`}>
                {msg.role === 'user'
                  ? (profile?.full_name?.[0] || 'U').toUpperCase()
                  : <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                }
              </div>

              <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user' ? 'message-user shadow-blue-500/20' : 'message-ai shadow-slate-200/20 dark:shadow-none'
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.created_at && (
                    <span className="text-xs text-slate-400">{getRelativeTime(msg.created_at)}</span>
                  )}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      {copiedId === msg.id
                        ? <Check className="w-3 h-3 text-emerald-500" />
                        : <Copy className="w-3 h-3 text-slate-400" />
                      }
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="px-4 sm:px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-end gap-3 max-w-4xl mx-auto relative">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask about symptoms, medications, appointments..."}
                className="w-full px-5 py-4 pr-24 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm leading-relaxed min-h-[52px] max-h-40 shadow-sm"
                rows={1}
                style={{ height: 'auto' }}
              />
              
              {hasSupport && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                    isListening 
                      ? 'bg-red-100 text-red-500 dark:bg-red-900/30' 
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() && !isTyping}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                input.trim() || isTyping
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-glow-sm hover:shadow-glow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            AI responses are for informational purposes only. Always consult a healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
