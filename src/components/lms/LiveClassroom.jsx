import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import {
  Video, Mic, MicOff, VideoOff, MessageSquare, Send,
  Users, Hand, Share2, Monitor, Edit3, Trash2, Download,
  ArrowLeft, ShieldCheck, CheckCircle2, Clock, Sparkles, X, Palette, Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveClassroom({ classId: propClassId, currentUser }) {
  const { classId: routeClassId } = useParams();
  const classId = propClassId || routeClassId;
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'whiteboard' | 'attendees' | 'agenda'
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [raisedHandsCount, setRaisedHandsCount] = useState(3);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Dr. Femi Ojo (Host)", role: "Instructor", text: "Welcome everyone to today's interactive masterclass on AI-Powered Pedagogy!", time: "17:00" },
    { id: 2, sender: "Mr. Adebayo Okafor", role: "Teacher", text: "Excited to be here. Ready for the whiteboard exercise.", time: "17:01" },
    { id: 3, sender: "Mrs. Grace Ojo", role: "Teacher", text: "Could we also review the Cambridge command words rubric during Q&A?", time: "17:02" }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef(null);

  // Whiteboard Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#CC5833'); // Clay
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  // Daily.co Container
  const dailyContainerRef = useRef(null);
  const [dailyCallFrame, setDailyCallFrame] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch Class Info
  useEffect(() => {
    async function fetchClass() {
      try {
        const res = await fetch(`${API_BASE}/lms/live-classes`);
        if (res.ok) {
          const classes = await res.json();
          const found = classes.find(c => c.id === classId);
          if (found) {
            setClassInfo(found);
          } else {
            // Default mock live masterclass
            setClassInfo({
              id: classId,
              title: "AI in Live Tutoring Rooms: Real-time Demonstration & Whiteboard Drills",
              description: "Live interactive training masterclass with senior academy mentors.",
              instructorName: "Dr. Femi Ojo",
              instructorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
              scheduledStartTime: new Date().toISOString(),
              durationMinutes: 60,
              roomUrl: "https://edubridge.daily.co/demo-masterclass",
              agenda: [
                "1. Priming ChatGPT and Gemini with Cambridge Syllabus Codes",
                "2. Live screen share: Co-teaching with AI assistants",
                "3. Interactive Whiteboard geometry & problem-solving drill",
                "4. Q&A and Certification Graduation"
              ],
              resources: [
                { title: "Live Masterclass Slide Deck (PDF)", url: "#" }
              ]
            });
          }
        }
      } catch (err) {
        console.warn("Live class fetch fallback:", err);
        setClassInfo({
          id: classId,
          title: "AI in Live Tutoring Rooms: Real-time Demonstration & Whiteboard Drills",
          description: "Live interactive training masterclass with senior academy mentors.",
          instructorName: "Dr. Femi Ojo",
          instructorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
          scheduledStartTime: new Date().toISOString(),
          durationMinutes: 60,
          roomUrl: "https://edubridge.daily.co/demo-masterclass",
          agenda: [
            "1. Priming ChatGPT and Gemini with Cambridge Syllabus Codes",
            "2. Live screen share: Co-teaching with AI assistants",
            "3. Interactive Whiteboard geometry & problem-solving drill",
            "4. Q&A and Certification Graduation"
          ],
          resources: [
            { title: "Live Masterclass Slide Deck (PDF)", url: "#" }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    fetchClass();
  }, [classId]);

  // Daily.co setup if roomUrl is standard daily room
  useEffect(() => {
    if (!dailyContainerRef.current || !classInfo?.roomUrl) return;

    // Only init if real Daily URL is provided
    if (classInfo.roomUrl.includes('daily.co') && !classInfo.roomUrl.includes('demo-masterclass')) {
      try {
        const frame = DailyIframe.createFrame(dailyContainerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '1.5rem'
          },
          showLeaveButton: true,
          showFullscreenButton: true
        });
        frame.join({ url: classInfo.roomUrl });
        setDailyCallFrame(frame);

        return () => {
          frame.destroy();
        };
      } catch (err) {
        console.warn("Daily frame initialization skipped:", err);
      }
    }
  }, [classInfo]);

  // Whiteboard Canvas Init
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas resolution
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 480;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(46, 64, 54, 0.06)';
      ctx.lineWidth = 1;
      const step = 25;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [activeTab]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  // Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : drawColor;
    ctx.lineWidth = isEraser ? 24 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success("Whiteboard cleared");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: currentUser?.displayName || "You (Teacher)",
      role: currentUser?.role || "Teacher",
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMsg('');
  };

  const handleToggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    setRaisedHandsCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
    toast(newState ? "✋ Hand raised! The instructor has been alerted." : "Hand lowered.");
  };

  if (loading || !classInfo) {
    return (
      <div className="min-h-screen bg-brand-charcoal flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-clay border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-brand-cream/70">Connecting to Live Studio Room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/10 bg-brand-charcoal/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/academy')}
            className="p-2 rounded-full hover:bg-white/10 text-brand-cream/80 hover:text-white transition-colors"
            title="Exit Classroom"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                LIVE MASTERCLASS
              </span>
              <span className="text-xs text-brand-cream/50 hidden md:inline font-mono">
                {classInfo.durationMinutes} min session
              </span>
            </div>
            <h2 className="font-heading font-bold text-sm text-white truncate max-w-md">
              {classInfo.title}
            </h2>
          </div>
        </div>

        {/* Instructor badge & participant counter */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full py-1.5 px-3">
            <img
              src={classInfo.instructorAvatar}
              alt={classInfo.instructorName}
              className="w-6 h-6 rounded-full object-cover border border-brand-clay"
            />
            <span className="text-xs font-bold text-brand-cream/90">{classInfo.instructorName}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-brand-moss/40 border border-white/10 py-1.5 px-3 rounded-full text-xs font-mono">
            <Users className="w-4 h-4 text-brand-clay" />
            <span>48 Online</span>
          </div>
        </div>
      </header>

      {/* Main Classroom Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Interactive Stage View */}
        <div className="flex-1 flex flex-col bg-black/40 relative overflow-hidden p-4 md:p-6 justify-between">
          {/* Main Stage Component (Video Stream or Whiteboard) */}
          <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/10 bg-brand-charcoal/90 flex flex-col">
            {activeTab === 'whiteboard' ? (
              /* Collaborative Whiteboard Canvas */
              <div className="flex-1 flex flex-col bg-white text-brand-charcoal relative">
                {/* Whiteboard Toolbar */}
                <div className="p-3 bg-brand-cream/80 border-b border-brand-moss/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-brand-moss mr-2 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-brand-clay" />
                      Collaborative Board
                    </span>

                    {/* Color Swatches */}
                    {['#CC5833', '#2E4036', '#1E40AF', '#B45309', '#047857'].map(color => (
                      <button
                        key={color}
                        onClick={() => { setDrawColor(color); setIsEraser(false); }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${drawColor === color && !isEraser ? 'scale-125 border-brand-charcoal' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}

                    <div className="h-4 w-px bg-brand-moss/20 mx-1" />

                    {/* Stroke Width Selector */}
                    {[2, 4, 8].map(w => (
                      <button
                        key={w}
                        onClick={() => { setLineWidth(w); setIsEraser(false); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${lineWidth === w && !isEraser ? 'bg-brand-moss text-white' : 'bg-white/60 text-brand-moss'}`}
                      >
                        {w}px
                      </button>
                    ))}

                    <button
                      onClick={() => setIsEraser(!isEraser)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${isEraser ? 'bg-brand-clay text-white' : 'bg-white text-brand-moss border border-brand-moss/10'}`}
                    >
                      Eraser
                    </button>
                  </div>

                  <button
                    onClick={clearWhiteboard}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-1 px-3 rounded-full font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>

                {/* Drawing Surface */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="flex-1 cursor-crosshair touch-none w-full"
                />
              </div>
            ) : (
              /* Video Stream Stage */
              <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                {/* Embedded Daily Frame or Responsive Multi-Tile Sim */}
                <div ref={dailyContainerRef} className="w-full h-full absolute inset-0">
                  {/* Fallback Simulator Tiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4">
                    {/* Primary Speaker (Dr. Femi Ojo) */}
                    <div className="relative rounded-2xl overflow-hidden bg-brand-moss/20 border border-white/10 flex items-center justify-center group shadow-inner">
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop"
                        alt="Dr. Femi Ojo"
                        className="w-full h-full object-cover brightness-95 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-brand-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Host · Dr. Femi Ojo
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono">
                        Speaking: Cambridge Physics Prompting
                      </div>
                    </div>

                    {/* Secondary Trainee Screen / Self Tile */}
                    <div className="relative rounded-2xl overflow-hidden bg-brand-moss/30 border border-white/10 flex items-center justify-center">
                      {isVideoOn ? (
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                          alt="Self Video"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full bg-brand-clay flex items-center justify-center text-white font-bold text-xl">
                            {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : "EB"}
                          </div>
                          <span className="text-xs font-mono text-white/70">Camera Paused</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-brand-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
                        {currentUser?.displayName || "You (Teacher)"}
                      </div>
                      <div className="absolute bottom-3 right-3 flex gap-1.5">
                        <span className={`p-1.5 rounded-full ${isMicOn ? 'bg-emerald-500/80' : 'bg-rose-500/80'} text-white`}>
                          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Call Controls Dock */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { setIsMicOn(!isMicOn); toast(isMicOn ? "Microphone muted" : "Microphone active"); }}
              className={`p-3.5 rounded-full transition-all duration-200 ${isMicOn ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => { setIsVideoOn(!isVideoOn); toast(isVideoOn ? "Camera stopped" : "Camera turned on"); }}
              className={`p-3.5 rounded-full transition-all duration-200 ${isVideoOn ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}
              title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => { setIsScreenSharing(!isScreenSharing); toast(isScreenSharing ? "Screen share stopped" : "Screen sharing activated"); }}
              className={`p-3.5 rounded-full transition-all duration-200 ${isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleHand}
              className={`flex items-center gap-2 py-3 px-5 rounded-full transition-all duration-200 font-bold text-xs ${isHandRaised ? 'bg-amber-500 text-brand-charcoal shadow-lg shadow-amber-500/30 animate-bounce' : 'bg-white/15 hover:bg-white/25 text-white'}`}
            >
              <Hand className="w-4 h-4" />
              <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
              {raisedHandsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-charcoal/40 text-[10px]">
                  {raisedHandsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'whiteboard' ? 'chat' : 'whiteboard')}
              className={`flex items-center gap-2 py-3 px-5 rounded-full transition-all duration-200 font-bold text-xs ${activeTab === 'whiteboard' ? 'bg-brand-clay text-white shadow-lg shadow-brand-clay/30' : 'bg-white/15 hover:bg-white/25 text-white'}`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{activeTab === 'whiteboard' ? 'Return to Stream' : 'Open Whiteboard'}</span>
            </button>

            <button
              onClick={() => navigate('/academy')}
              className="py-3 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Right Sidebar: Chat, Agenda, Attendees */}
        <div className="w-full lg:w-96 bg-brand-charcoal border-l border-white/10 flex flex-col h-full shrink-0">
          {/* Subtabs */}
          <div className="p-3 border-b border-white/10 grid grid-cols-3 gap-1 bg-white/5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'chat' ? 'bg-brand-clay text-white shadow-md' : 'text-brand-cream/60 hover:text-white'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'agenda' ? 'bg-brand-clay text-white shadow-md' : 'text-brand-cream/60 hover:text-white'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              Agenda
            </button>
            <button
              onClick={() => setActiveTab('attendees')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'attendees' ? 'bg-brand-clay text-white shadow-md' : 'text-brand-cream/60 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Roster (48)
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full justify-between space-y-4">
                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.map(msg => {
                    const isMe = msg.sender.includes('You');
                    const isHost = msg.role === 'Instructor';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[9px] font-bold text-brand-cream/60">{msg.sender}</span>
                          {isHost && (
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[8px] font-mono px-1.5 py-0.2 rounded-full">HOST</span>
                          )}
                          <span className="font-mono text-[8px] text-white/30">{msg.time}</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${isMe ? 'bg-brand-clay text-white rounded-tr-none' : isHost ? 'bg-brand-moss/60 border border-amber-400/20 text-white rounded-tl-none' : 'bg-white/10 text-brand-cream rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or share response..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-brand-clay"
                  />
                  <button
                    type="submit"
                    disabled={!inputMsg.trim()}
                    className="w-9 h-9 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-heading font-bold text-sm text-white mb-2">Masterclass Outline</h4>
                  <div className="space-y-2">
                    {(classInfo.agenda || []).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-clay shrink-0 mt-0.5" />
                        <span className="text-brand-cream/80 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {classInfo.resources?.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay mb-2">Classroom Resources</h4>
                    {classInfo.resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-colors"
                      >
                        <span className="truncate">{res.title}</span>
                        <Download className="w-4 h-4 text-brand-clay shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendees' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-white/50 pb-2 border-b border-white/10">
                  <span>PARTICIPANTS</span>
                  <span className="text-emerald-400 font-bold">48 CONNECTED</span>
                </div>

                {/* Host */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-moss/40 border border-amber-400/30">
                  <div className="flex items-center gap-2.5">
                    <img src={classInfo.instructorAvatar} alt="Host" className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">{classInfo.instructorName}</span>
                      <span className="text-[9px] font-mono text-amber-300 font-bold uppercase">Master Lead Instructor</span>
                    </div>
                  </div>
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>

                {/* Fellow Trainees */}
                {[
                  { name: "Mr. Adebayo Okafor", role: "Elite Math Tutor", mic: true, hand: true },
                  { name: "Mrs. Grace Ojo", role: "Early Years Lead", mic: false, hand: false },
                  { name: "Dr. Kofi Mensah", role: "IGCSE Science Lead", mic: false, hand: true },
                  { name: "Miss Amina Bello", role: "Primary Educator", mic: false, hand: false },
                  { name: "Mr. Samuel Kalu", role: "STEM Specialist", mic: false, hand: false }
                ].map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-clay/30 border border-brand-clay/50 flex items-center justify-center text-xs font-bold text-white">
                        {att.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{att.name}</span>
                        <span className="text-[9px] font-mono text-brand-cream/50 block">{att.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {att.hand && <Hand className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
                      {att.mic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
