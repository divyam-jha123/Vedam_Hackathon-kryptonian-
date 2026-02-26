import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, ArrowRight, Monitor, Smartphone, BookOpen,
  Gift, MoreVertical, X, UploadCloud, FileText, Loader2, Mic, MicOff
} from 'lucide-react';
import {
  getSubjects, createSubject,
  uploadNote, deleteNote,
  sendMessage, getChatHistory,
} from '../api/askMyNotes';

// ─── Confidence Badge ───
const ConfidenceBadge = ({ level }) => {
  const colors = {
    High: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Low: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${colors[level] || colors.Low}`}>
      {level}
    </span>
  );
};

const StitchInterface = () => {
  const [device, setDevice] = useState('app');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Backend state
  const [subjectId, setSubjectId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Voice
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Auto-create or load a default subject on mount
  useEffect(() => {
    initSubject();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initSubject() {
    try {
      const subjects = await getSubjects();
      if (subjects.length > 0) {
        setSubjectId(subjects[0]._id);
        // Load existing chat history
        const history = await getChatHistory(subjects[0]._id);
        setMessages(history);
        setUploadedFiles(subjects[0].notes || []);
      } else {
        const subject = await createSubject('My Notes');
        setSubjectId(subject._id);
      }
    } catch (err) {
      console.error('Init subject error:', err);
    }
  }

  // ─── File upload ───
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function processUpload(file) {
    if (!subjectId) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      setError('Only PDF and TXT files are supported.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const result = await uploadNote(subjectId, file);
      setUploadedFiles((prev) => [...prev, { _id: result.noteId, originalName: result.originalName }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteNote(noteId) {
    if (!subjectId) return;
    try {
      await deleteNote(subjectId, noteId);
      setUploadedFiles((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── Chat ───
  async function handleSend() {
    if (!input.trim() || !subjectId || sending) return;
    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    try {
      setSending(true);
      const answer = await sendMessage(subjectId, question);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: typeof answer.answer === 'string' ? answer.answer : (answer.answer?.answer || JSON.stringify(answer)),
        citations: answer.citations || [],
        confidence: answer.confidence || 'Low',
        evidence: answer.evidence || [],
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  // ─── Voice ───
  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-300 font-sans p-6 selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">Smash</span>
          <span className="bg-gray-800 text-[10px] px-2 py-0.5 rounded-full text-gray-400">BETA</span>
        </div>

        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 hover:text-white transition-colors"><BookOpen size={18} /> Docs</button>
          <button className="hover:text-white transition-colors">Discord</button>
          <button className="hover:text-white transition-colors">X</button>
          <button className="relative hover:text-white transition-colors">
            <Gift size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]"></span>
          </button>
          <MoreVertical size={20} className="cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-green-400 border border-white/20" />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto flex flex-col items-center">

        {/* Export Notification */}
        <div className="mb-10 flex items-center gap-3 bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20">
          <span>New: Export to Figma</span>
          <X size={14} className="cursor-pointer opacity-70 hover:opacity-100" />
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-medium text-white">Start a new</h2>
          <div className="bg-[#1a1a1e] border border-gray-800 p-1 rounded-xl flex">
            <button
              onClick={() => setDevice('app')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${device === 'app' ? 'bg-[#2a2a30] text-white' : 'text-gray-500'}`}
            >
              <Smartphone size={16} /> App
            </button>
            <button
              onClick={() => setDevice('web')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${device === 'web' ? 'bg-[#2a2a30] text-white' : 'text-gray-500'}`}
            >
              <Monitor size={16} /> Web
            </button>
          </div>
          <h2 className="text-2xl font-medium text-white">design</h2>
        </div>

        {/* File Drop Section */}
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.txt" className="hidden" />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full mb-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer
            ${isDragging
              ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              : 'border-white/10 bg-white/[0.02] hover:border-purple-500/50 hover:bg-purple-500/[0.02]'}`}
        >
          <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 group-hover:text-purple-400'}`}>
            {uploading ? <Loader2 size={28} className="animate-spin" /> : <UploadCloud size={28} />}
          </div>
          <p className="text-sm font-medium text-gray-300">
            {uploading ? 'Processing your file...' : <>Drop files here or <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400 font-bold">browse</span></>}
          </p>
          <p className="text-xs text-gray-500 mt-1">PDF or TXT files</p>
        </div>



        {/* Error */}
        {error && (
          <div className="w-full mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* ─── Chat Messages (above the input box) ─── */}
        {messages.length > 0 && (
          <div className="w-full mb-4 max-h-[400px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-purple-600/90 text-white rounded-br-md'
                    : 'bg-[#1a1a1e] border border-white/5 text-gray-200 rounded-bl-md'
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        const content = msg.content || '';
                        if (typeof content === 'string' && content.trim().startsWith('{')) {
                          try {
                            const parsed = JSON.parse(content);
                            return parsed.answer || content;
                          } catch {
                            return content;
                          }
                        }
                        return content;
                      })()}
                    </p>
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                        {msg.confidence && <ConfidenceBadge level={msg.confidence} />}
                        {msg.citations.map((c, j) => (
                          <span key={j} className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
                            <FileText size={10} />
                            {c.file}{c.page ? `:p${c.page}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isUser && msg.evidence && msg.evidence.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[11px] text-gray-500 cursor-pointer hover:text-gray-300">View evidence</summary>
                        <div className="mt-1 space-y-1">
                          {msg.evidence.map((e, j) => (
                            <p key={j} className="text-[11px] text-gray-500 bg-white/5 rounded p-2 italic">"{e}"</p>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1e] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Main Search/Input Box */}
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-500 to-green-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0d0d0f] border border-white/10 rounded-2xl p-6 min-h-[200px] flex flex-col justify-between shadow-2xl">

            {/* Uploaded files cards inside input area */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {uploadedFiles.map((f) => (
                  <div key={f._id} className="relative flex items-center gap-3 bg-[#1e1e20] border border-white/10 rounded-xl p-3 min-w-[280px] group/card">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.originalName}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-tight">Document</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(f._id); }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 text-black hover:bg-gray-200 transition-colors shadow-lg cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              placeholder={uploadedFiles.length === 0 ? "Upload a PDF or TXT first, then ask questions…" : "Ask anything about your notes…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending}
              className="bg-transparent border-none outline-none text-xl text-white placeholder-gray-600 resize-none w-full h-32"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full border border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#1a1a1e] border border-gray-800 px-3 py-1.5 rounded-full text-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-green-400 rounded-full" />
                  <span className="text-gray-300">Gemini</span>
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || uploadedFiles.length === 0}
                  className="bg-gray-800 p-2 rounded-full text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="w-full mt-10 space-y-3">
          <p className="text-sm text-gray-500 ml-1">Try these prompts</p>
          <div className="flex flex-col gap-2">
            {[
              "Summarize the key concepts from my notes",
              "What are the most important topics covered?"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); }}
                className="text-left bg-transparent border border-gray-800 px-4 py-3 rounded-xl text-sm text-gray-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StitchInterface;