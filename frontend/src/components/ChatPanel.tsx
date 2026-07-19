'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, LogIn, MessageSquare, ShieldAlert, Sparkles, HelpCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ChatPanelProps {
  gameId: string;
  initialMessages: any[];
  currentUser: any;
  userProfile: any;
  token: string | null;
  developerId?: string;
}

export default function ChatPanel({
  gameId,
  initialMessages,
  currentUser,
  userProfile,
  token,
  developerId,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [input, setInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'bug' | 'idea'>('all');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Settings loaded from local storage
  const [panelSettings, setPanelSettings] = useState({
    layoutDensity: 'standard',
    slowMode: 0,
    toxicityFilter: true,
    routingBugs: true,
    routingSuggestions: true,
    routingGeneral: true,
  });

  // Slow mode countdown state
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeFilter]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Load local settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('godslink_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPanelSettings(prev => ({ ...prev, ...parsed }));
        
        // Auto set active tab if general lobby routing is disabled
        if (parsed.routingGeneral === false) {
          if (parsed.routingBugs) setActiveFilter('bug');
          else if (parsed.routingSuggestions) setActiveFilter('idea');
        }
      } catch (e) {}
    }
  }, []);

  // Handle slow mode countdown decrement
  useEffect(() => {
    if (slowModeCountdown > 0) {
      const timer = setTimeout(() => {
        setSlowModeCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [slowModeCountdown]);

  useEffect(() => {
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
    
    // Connect to Socket.io server
    const socket = io(socketServerUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      socket.emit('join_game', { gameId });
    });

    // Listen for new messages
    socket.on('new_message', (message: any) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('error_message', (msg: string) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    return () => {
      socket.emit('leave_game', { gameId });
      socket.off('new_message');
      socket.off('error_message');
      socket.disconnect();
    };
  }, [gameId, token]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !socketRef.current) return;

    // Enforce Slow Mode restriction
    if (slowModeCountdown > 0) {
      setErrorMsg(`⚠️ Slow Mode: Please wait ${slowModeCountdown}s before posting again.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const testInput = input.trim().toLowerCase();

    // Enforce Toxicity Filter if enabled
    if (panelSettings.toxicityFilter) {
      const blockedWords = ['toxic', 'fuck', 'shit', 'cheat', 'hack', 'noob', 'garbage'];
      const containsBlocked = blockedWords.some(word => testInput.includes(word));
      if (containsBlocked) {
        setErrorMsg('⚠️ Automated Filter: Your message contains language that violates community guidelines!');
        setTimeout(() => setErrorMsg(''), 6000);
        return;
      }
    }

    let finalMessage = input.trim();
    if (activeFilter === 'bug' && !finalMessage.startsWith('[Bug]')) {
      finalMessage = `[Bug] ${finalMessage}`;
    } else if (activeFilter === 'idea' && !finalMessage.startsWith('[Idea]')) {
      finalMessage = `[Idea] ${finalMessage}`;
    }

    socketRef.current.emit('send_message', {
      gameId,
      userId: currentUser.id,
      message: finalMessage,
    });

    setInput('');

    // Trigger Slow Mode countdown if enabled
    if (panelSettings.slowMode > 0) {
      setSlowModeCountdown(panelSettings.slowMode);
    }
  };

  // Filter messages dynamically
  const filteredMessages = messages.filter((msg) => {
    const text = msg.message.toLowerCase();
    if (activeFilter === 'bug') {
      return msg.message.startsWith('[Bug]') || text.includes('bug') || text.includes('error') || text.includes('issue');
    }
    if (activeFilter === 'idea') {
      return msg.message.startsWith('[Idea]') || text.includes('idea') || text.includes('feature') || text.includes('suggest');
    }
    return true;
  });

  const isCompact = panelSettings.layoutDensity === 'compact';

  return (
    <div className={`flex flex-col h-full bg-discord-sidebar text-discord-text-light ${isCompact ? 'compact-ide' : ''}`}>
      
      {/* Header */}
      <div className="p-4 bg-discord-sidebar border-b border-discord-card flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-discord-blurple" />
          <div>
            <h2 className="font-extrabold text-sm text-white"># dev-hotline</h2>
            <p className="text-[10px] text-discord-text-muted">Live creator contact feed</p>
          </div>
        </div>
        <span className="text-[9px] font-bold text-discord-text-muted bg-discord-card border border-discord-bg px-2 py-0.5 rounded-full">
          {filteredMessages.length} msg
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar bg-discord-bg">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-discord-text-muted py-8 text-center">
            {activeFilter === 'bug' ? (
              <>
                <ShieldAlert className="w-8 h-8 opacity-40 mb-2 text-red-400" />
                <p className="text-xs font-semibold text-white">No bug reports found</p>
                <p className="text-[10px] opacity-75 max-w-[200px]">Switch tab to post or filter active issues.</p>
              </>
            ) : activeFilter === 'idea' ? (
              <>
                <Sparkles className="w-8 h-8 opacity-40 mb-2 text-green-400" />
                <p className="text-xs font-semibold text-white">No feature ideas found</p>
                <p className="text-[10px] opacity-75 max-w-[200px]">Be the first to suggest improvements!</p>
              </>
            ) : (
              <>
                <MessageSquare className="w-8 h-8 opacity-40 mb-2 text-discord-blurple" />
                <p className="text-xs font-semibold text-white">Welcome to #dev-hotline!</p>
                <p className="text-[10px] opacity-75">Send a message to start the conversation.</p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isDev = msg.profiles?.role === 'developer';
            const isCreator = msg.user_id === developerId;
            const username = msg.profiles?.username || 'user';
            const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Extract tags for visual highlight if present
            const isBugMsg = msg.message.startsWith('[Bug]');
            const isIdeaMsg = msg.message.startsWith('[Idea]');
            const displayMessage = isBugMsg 
              ? msg.message.substring(5).trim() 
              : isIdeaMsg 
                ? msg.message.substring(6).trim() 
                : msg.message;

            return (
              <div key={msg.id} className="flex flex-col group hover:bg-discord-card/30 -mx-4 px-4 py-1.5 transition">
                <div className="flex items-center flex-wrap gap-2">
                  <span
                    className={`font-bold text-sm tracking-wide transition ${
                      isCreator 
                        ? 'text-red-400' 
                        : isDev 
                          ? 'text-discord-blurple' 
                          : 'text-discord-text-light'
                    }`}
                  >
                    {username}
                  </span>

                  {/* Creator Badge */}
                  {isCreator && (
                    <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.25)] uppercase tracking-wider scale-90 origin-left">
                      CREATOR
                    </span>
                  )}

                  {/* Regular Developer Badge */}
                  {!isCreator && isDev && (
                    <span className="text-[9px] font-extrabold bg-discord-blurple/10 text-discord-blurple border border-discord-blurple/20 px-1 rounded uppercase tracking-wider scale-90 origin-left">
                      Dev
                    </span>
                  )}

                  <span className="text-[10px] text-discord-text-muted font-medium">{formattedTime}</span>
                </div>
                
                {/* Message display area */}
                <div className="flex items-start gap-2 mt-1 min-w-0">
                  {isBugMsg && (
                    <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                      BUG
                    </span>
                  )}
                  {isIdeaMsg && (
                    <span className="text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                      IDEA
                    </span>
                  )}
                  <p className="text-sm text-discord-text-light break-words font-medium flex-1">
                    {displayMessage}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Toggle filter (subject to Developer Routing Toggles) */}
      <div className="flex items-center gap-1 border-t border-discord-card bg-discord-sidebar px-3 py-2 text-xs flex-shrink-0 overflow-x-auto custom-scrollbar">
        {panelSettings.routingGeneral && (
          <button 
            type="button" 
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded font-bold transition flex-shrink-0 ${
              activeFilter === 'all' 
                ? 'bg-discord-blurple text-white shadow-sm' 
                : 'text-discord-text-muted hover:text-white hover:bg-discord-card'
            }`}
          >
            Chat
          </button>
        )}
        {panelSettings.routingBugs && (
          <button 
            type="button" 
            onClick={() => setActiveFilter('bug')}
            className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 flex-shrink-0 ${
              activeFilter === 'bug' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                : 'text-discord-text-muted hover:text-white hover:bg-discord-card'
            }`}
          >
            🐛 Report Bug
          </button>
        )}
        {panelSettings.routingSuggestions && (
          <button 
            type="button" 
            onClick={() => setActiveFilter('idea')}
            className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 flex-shrink-0 ${
              activeFilter === 'idea' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.2)]' 
                : 'text-discord-text-muted hover:text-white hover:bg-discord-card'
            }`}
          >
            💡 Idea
          </button>
        )}
      </div>

      {/* Input Panel */}
      <div className="p-4 bg-discord-sidebar border-t border-discord-card flex-shrink-0">
        {errorMsg && (
          <div className="mb-2 text-xs text-red-200 bg-red-950/40 border border-red-800/40 rounded p-2 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {currentUser ? (
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              disabled={slowModeCountdown > 0}
              placeholder={
                slowModeCountdown > 0
                  ? `Slow mode is active. Wait ${slowModeCountdown}s...`
                  : activeFilter === 'bug' 
                    ? 'Submit bug report (tag [Bug] auto-applied)...'
                    : activeFilter === 'idea'
                      ? 'Submit idea (tag [Idea] auto-applied)...'
                      : `Message #dev-hotline`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-discord-card border border-discord-bg focus:border-discord-blurple/80 focus:ring-1 focus:ring-discord-blurple/80 rounded-lg py-2.5 pl-4 pr-12 text-sm text-white placeholder-discord-text-muted outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || slowModeCountdown > 0}
              className="absolute right-2 p-1.5 bg-discord-blurple hover:bg-[#4752c4] disabled:bg-discord-card disabled:text-discord-text-muted text-white rounded-md transition duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="bg-discord-card border border-discord-bg rounded-lg p-3 text-center flex flex-col items-center">
            <p className="text-xs text-discord-text-muted font-bold mb-2">You must be logged in to participate in the chat</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-discord-blurple hover:bg-[#4752c4] text-white text-xs font-extrabold py-1.5 px-4 rounded-lg transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login to Chat</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
