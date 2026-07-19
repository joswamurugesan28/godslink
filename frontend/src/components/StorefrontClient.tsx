'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight, Hash, Volume2, User, HelpCircle, Shield, Sparkles, Search, Palette, Settings, Lock, Plus, Send, X, MessageSquare, Check, ShieldCheck, Heart, Radio, Menu, Users } from 'lucide-react';

interface StorefrontClientProps {
  initialGames: any[];
  initialProfiles: any[];
  initialUser: any;
}

interface ChannelObj {
  name: string;
  type: 'text' | 'voice' | 'announcement';
}

interface RoleObj {
  id: string;
  name: string;
  color: string;
}

interface BotObj {
  id: string;
  name: string;
  avatar: string;
  description: string;
  logoUrl?: string;
}

interface ServerObj {
  id: string;
  name: string;
  icon: string;
  logoUrl: string;
  channels: ChannelObj[];
  roles: RoleObj[];
  bots: BotObj[];
}

export default function StorefrontClient({
  initialGames,
  initialProfiles,
  initialUser,
}: StorefrontClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState<'discord' | 'itch' | 'neon' | 'custom'>('discord');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'identity' | 'themes' | 'moderation' | 'collab' | 'integrations'>('identity');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileRosterOpen, setIsMobileRosterOpen] = useState(false);

  // Server management with custom roles, bots, channels & custom logo image URLs
  const [servers, setServers] = useState<ServerObj[]>([
    { 
      id: 'godslink', 
      name: 'GodsLink Hub', 
      icon: '⚔️', 
      logoUrl: '',
      channels: [
        { name: 'all-games', type: 'text' as const },
        { name: 'announcements', type: 'announcement' as const }
      ],
      roles: [
        { id: 'r1', name: 'CREATOR', color: '#ff0055' },
        { id: 'r2', name: 'GAMER', color: '#00ffcc' }
      ],
      bots: [
        { id: 'b1', name: 'MEE6', avatar: '🤖', logoUrl: '', description: 'Welcomes new players to the lobby.' }
      ]
    },
    { 
      id: 'null-server', 
      name: 'NULL Server', 
      icon: 'N', 
      logoUrl: '',
      channels: [
        { name: 'general-chat', type: 'text' as const },
        { name: 'dev-questions', type: 'text' as const },
        { name: 'bug-logs', type: 'text' as const },
        { name: 'dev-voice', type: 'voice' as const }
      ],
      roles: [
        { id: 'r3', name: 'ADMINS', color: '#ffaa00' },
        { id: 'r4', name: 'VANGUARDS', color: '#00ccff' }
      ],
      bots: [
        { id: 'b2', name: 'Dyno', avatar: '🤖', logoUrl: '', description: 'Performs pipeline audit commands.' }
      ]
    }
  ]);
  
  const [activeServerId, setActiveServerId] = useState('godslink');
  const [activeChannel, setActiveChannel] = useState('all-games');
  
  // Add Server States
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('👾');

  // Server settings modal states
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [activeServerTab, setActiveServerTab] = useState<'overview' | 'roles' | 'bots'>('overview');
  
  // Role creator states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#5865f2');

  // Add Channel Modal states
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'announcement'>('text');

  // Simulated Voice Connection status state
  const [voiceConnection, setVoiceConnection] = useState<{ serverName: string, channelName: string } | null>(null);
  
  // Available bots to invite
  const availableBots = [
    { id: 'mee6', name: 'MEE6', avatar: '🤖', description: 'Welcome messages & leveling.' },
    { id: 'dyno', name: 'Dyno', avatar: '🤖', description: 'Auto-moderator & server utility.' },
    { id: 'rythm', name: 'Rythm', avatar: '🎵', description: 'Streams coding music playlists.' }
  ];

  // Unified settings state (with custom avatar picture URLs)
  const [settings, setSettings] = useState({
    displayName: initialUser?.username || 'Guest User',
    statusMessage: '🎮 Playing Hades Ascending',
    role: initialUser?.role || 'gamer',
    avatar: '🎮',
    avatarUrl: '', // Custom avatar image link
    layoutDensity: 'standard',
    bio: '👾 Indie Game Developer | GodsLink Admin 🛡️',
    profileBanner: 'sunset', // sunset, ocean, emerald, void

    // Custom App Theme Hex Settings
    customBgColor: '#1e1f22',
    customSidebarColor: '#2b2d31',
    customCardColor: '#111214',
    customAccentColor: '#5865f2',

    // Launch & Moderation
    accessLevel: 'public',
    routingBugs: true,
    routingSuggestions: true,
    routingGeneral: true,
    toxicityFilter: true,
    slowMode: 0,
    upvoteTriage: true,

    // Collaboration Engine
    markdownHighlight: true,
    lfgBroadcast: false,
    vacancyProgrammer: true,
    vacancySound: false,
    vacancyArtist: true,
    sandboxPermissions: 'Restricted',
    collaborators: 'Athena_Dev, Poseidon_Dev',

    // Core Integrations
    githubSync: 'https://github.com/godslink/store',
    discordPresence: true,
  });

  // Dynamic games list (includes published games during session)
  const [sessionGames, setSessionGames] = useState<any[]>([]);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');
  const [newGameTags, setNewGameTags] = useState('Action, Indie');

  // Server messages list (for custom servers chat)
  const [serverMessages, setServerMessages] = useState<Record<string, any[]>>({
    'general-chat': [
      { id: 'm1', username: 'NULL_Admin', role: 'developer', avatar: '🔱', message: 'Welcome to the NULL server! Let me know if you need administrative controls.', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'm2', username: 'Hades_Gamer', role: 'gamer', avatar: '💀', message: 'This server is super clean, is this hosted locally?', created_at: new Date(Date.now() - 300000).toISOString() }
    ],
    'dev-questions': [
      { id: 'm3', username: 'NULL_Admin', role: 'developer', avatar: '🔱', message: 'Use this channel to post pipeline issues or sync errors.', created_at: new Date().toISOString() }
    ]
  });
  const [serverInput, setServerInput] = useState('');

  // Hover states for tooltips
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  // Sync initial user details
  useEffect(() => {
    if (initialUser) {
      setSettings(prev => ({
        ...prev,
        displayName: initialUser.username || prev.displayName,
        role: initialUser.role || prev.role,
        bio: initialUser.username === 'NULL_Admin' ? '🛡️ NULL Server Admin | Executive Creator ⚔️' : prev.bio
      }));
    }
  }, [initialUser]);

  // Load configuration from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('godslink_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
        if (parsed.activeTheme) setActiveTheme(parsed.activeTheme);
      } catch (e) {}
    }
  }, []);

  // Save configurations to local storage
  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('godslink_settings', JSON.stringify(newSettings));
  };

  const updateAppTheme = (themeName: 'discord' | 'itch' | 'neon' | 'custom') => {
    setActiveTheme(themeName);
    const newSettings = { ...settings, activeTheme: themeName };
    localStorage.setItem('godslink_settings', JSON.stringify(newSettings));
  };

  // Avatar choices
  const avatarChoices = ['🎮', '🔱', '⚔️', '🛡️', '👾', '💎', '💀', '👽', '🚀'];

  // Banner choices
  const bannerGradients: Record<string, string> = {
    sunset: 'from-orange-500 via-pink-500 to-purple-600',
    ocean: 'from-blue-600 via-indigo-500 to-cyan-400',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
    void: 'from-[#1e1f22] via-[#2b2d31] to-black',
  };

  // Default pre-populated list of placeholder games
  const placeholderGames = [
    {
      id: 'placeholder-1',
      title: 'Hades Ascending',
      description: 'Brawl your way out of the underworld using legendary godly weapons and upgrades.',
      developer_username: 'Zeus_God',
      tags: ['Action', 'HTML5', 'RPG'],
    },
    {
      id: 'placeholder-2',
      title: "Athena's Labyrinth",
      description: 'Test your intellect in the goddess\'s maze of traps, riddles, and ancient guardians.',
      developer_username: 'Athena_Dev',
      tags: ['Puzzle', 'Web', '2D'],
    },
    {
      id: 'placeholder-3',
      title: "Poseidon's Odyssey",
      description: 'Navigate the deep oceans, fight legendary sea beasts, and control tidal storms.',
      developer_username: 'Poseidon_Dev',
      tags: ['Adventure', 'Pixel Art', 'Retro'],
    }
  ];

  // Combine database games, placeholders, and session-created games
  const allGames = [
    ...sessionGames,
    ...(initialGames || []).map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      developer_username: g.profiles?.username || 'Unknown',
      tags: ['Indie', 'Web'],
    })),
    ...placeholderGames
  ];

  // Filter storefront games list
  const filteredGames = allGames.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.developer_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle server creation
  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const newServer = {
      id: `custom-${Date.now()}`,
      name: newServerName.trim(),
      icon: newServerIcon,
      logoUrl: '',
      channels: [
        { name: 'general-chat', type: 'text' as const },
        { name: 'announcements', type: 'announcement' as const },
        { name: 'lobby', type: 'voice' as const }
      ],
      roles: [
        { id: `r-${Date.now()}-1`, name: 'ADMIN', color: '#5865f2' },
        { id: `r-${Date.now()}-2`, name: 'MEMBER', color: '#dbdee1' }
      ],
      bots: []
    };
    setServers([...servers, newServer]);
    setActiveServerId(newServer.id);
    setActiveChannel('general-chat');
    setNewServerName('');
    setIsAddServerOpen(false);
  };

  // Handle channel creation
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const cleanName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    const newChanObj: { name: string, type: 'text' | 'voice' | 'announcement' } = { name: cleanName, type: newChannelType };

    setServers(servers.map(s => {
      if (s.id === activeServerId) {
        return {
          ...s,
          channels: [...s.channels, newChanObj]
        };
      }
      return s;
    }));

    // Auto connect if voice
    if (newChannelType === 'voice') {
      setVoiceConnection({ serverName: activeServer.name, channelName: cleanName });
    }

    setNewChannelName('');
    setIsAddChannelOpen(false);
  };

  // Handle channel clicks
  const handleChannelClick = (chan: { name: string, type: 'text' | 'voice' | 'announcement' }) => {
    if (chan.type === 'voice') {
      setVoiceConnection({ serverName: activeServer.name, channelName: chan.name });
    }
    setActiveChannel(chan.name);
    setIsMobileSidebarOpen(false);
    setIsMobileRosterOpen(false);
  };

  // Handle game publishing
  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameTitle.trim()) return;
    const newGame = {
      id: `session-game-${Date.now()}`,
      title: newGameTitle.trim(),
      description: newGameDescription.trim() || 'No description provided.',
      developer_username: settings.displayName,
      tags: newGameTags.split(',').map(t => t.trim()),
    };
    setSessionGames([newGame, ...sessionGames]);
    setNewGameTitle('');
    setNewGameDescription('');
    setNewGameTags('Action, Indie');
    setIsAddGameOpen(false);
  };

  // Handle sending mock server messages
  const handleSendServerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverInput.trim()) return;
    
    // Check toxicity filter
    if (settings.toxicityFilter) {
      const blocked = ['toxic', 'fuck', 'shit', 'cheat', 'hack', 'noob', 'garbage'];
      if (blocked.some(w => serverInput.toLowerCase().includes(w))) {
        alert('⚠️ Automated Filter: Your message contains language that violates guidelines!');
        return;
      }
    }

    const newMessage = {
      id: `sm-${Date.now()}`,
      username: settings.displayName,
      role: settings.role,
      avatar: settings.avatar,
      avatarUrl: settings.avatarUrl,
      message: serverInput.trim(),
      created_at: new Date().toISOString()
    };

    const currentChannelMsgs = serverMessages[activeChannel] || [];
    setServerMessages({
      ...serverMessages,
      [activeChannel]: [...currentChannelMsgs, newMessage]
    });
    setServerInput('');
  };

  // Server settings overview update
  const handleUpdateServerOverview = (name: string, icon: string, logoUrl: string) => {
    setServers(servers.map(s => s.id === activeServerId ? { ...s, name, icon, logoUrl } : s));
  };

  // Add Server Role
  const handleAddServerRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setServers(servers.map(s => {
      if (s.id === activeServerId) {
        return {
          ...s,
          roles: [...(s.roles || []), { id: `role-${Date.now()}`, name: newRoleName.trim().toUpperCase(), color: newRoleColor }]
        };
      }
      return s;
    }));
    setNewRoleName('');
  };

  // Delete Server Role
  const handleDeleteServerRole = (roleId: string) => {
    setServers(servers.map(s => {
      if (s.id === activeServerId) {
        return {
          ...s,
          roles: (s.roles || []).filter(r => r.id !== roleId)
        };
      }
      return s;
    }));
  };

  // Invite Bot to server
  const handleInviteBot = (bot: any) => {
    setServers(servers.map(s => {
      if (s.id === activeServerId) {
        // Prevent duplicate invites
        if ((s.bots || []).some(b => b.id === bot.id)) return s;
        
        // Post welcome message in server chat
        const welcomeMsg = {
          id: `sm-bot-${Date.now()}`,
          username: `${bot.name} [BOT]`,
          role: 'developer',
          avatar: bot.avatar,
          message: `👋 Hello everyone! I am ${bot.name}. ${bot.description} Active and ready to assist!`,
          created_at: new Date().toISOString()
        };
        const currentChannelMsgs = serverMessages[activeChannel] || [];
        setServerMessages({
          ...serverMessages,
          [activeChannel]: [...currentChannelMsgs, welcomeMsg]
        });

        return {
          ...s,
          bots: [...(s.bots || []), bot]
        };
      }
      return s;
    }));
  };

  // Kick Bot from server
  const handleKickBot = (botId: string) => {
    setServers(servers.map(s => {
      if (s.id === activeServerId) {
        return {
          ...s,
          bots: (s.bots || []).filter(b => b.id !== botId)
        };
      }
      return s;
    }));
  };

  // Theme configuration values
  const themeStyles = {
    discord: {
      bg: 'bg-[#313338]',
      sidebar: 'bg-[#2b2d31] border-r border-[#1e1f22]',
      card: 'bg-[#1e1f22]',
      cardHover: 'hover:border-[#5865f2]/50',
      textLight: 'text-[#dbdee1]',
      textMuted: 'text-[#949ba4]',
      textTitle: 'text-white',
      accentText: 'text-[#5865f2]',
      accentBg: 'bg-[#5865f2]',
      accentBgHover: 'hover:bg-[#4752c4]',
      badge: 'bg-[#1e1f22] text-[#949ba4] border border-[#2b2d31]',
    },
    itch: {
      bg: 'bg-[#222222]',
      sidebar: 'bg-[#1b1b1b] border-r border-[#2d2d2d]',
      card: 'bg-[#2f2f2f]',
      cardHover: 'hover:border-[#fa5c5c]/50',
      textLight: 'text-[#e6e6e6]',
      textMuted: 'text-[#b0b0b0]',
      textTitle: 'text-white',
      accentText: 'text-[#fa5c5c]',
      accentBg: 'bg-[#fa5c5c]',
      accentBgHover: 'hover:bg-[#e44b4b]',
      badge: 'bg-[#1b1b1b] text-[#b0b0b0] border border-[#2d2d2d]',
    },
    neon: {
      bg: 'bg-black',
      sidebar: 'bg-[#0a0a0a] border-r border-[#00ffcc]/30',
      card: 'bg-[#121212]',
      cardHover: 'hover:border-[#00ffcc]',
      textLight: 'text-[#e0e0e0]',
      textMuted: 'text-[#888888]',
      textTitle: 'text-white',
      accentText: 'text-[#00ffcc]',
      accentBg: 'bg-[#00ffcc] text-black',
      accentBgHover: 'hover:bg-[#00ccaa]',
      badge: 'bg-[#0a0a0a] text-[#00ffcc] border border-[#00ffcc]/20',
    },
    custom: {
      bg: 'bg-[var(--color-discord-bg)]',
      sidebar: 'bg-[var(--color-discord-sidebar)] border-r border-[var(--color-discord-card)]',
      card: 'bg-[var(--color-discord-card)]',
      cardHover: 'hover:border-[var(--color-discord-blurple)]/50',
      textLight: 'text-[#dbdee1]',
      textMuted: 'text-[#949ba4]',
      textTitle: 'text-white',
      accentText: 'text-[var(--color-discord-blurple)]',
      accentBg: 'bg-[var(--color-discord-blurple)]',
      accentBgHover: 'hover:opacity-90',
      badge: 'bg-[var(--color-discord-card)] text-[#949ba4] border border-[var(--color-discord-sidebar)]',
    }
  };

  const style = themeStyles[activeTheme];
  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const isStorefront = activeServer.id === 'godslink';
  const isDev = settings.role === 'developer';

  // Roster lists user bios & custom banners map
  const rosterBios: Record<string, string> = {
    'Zeus_God': '⚡ Chief Architect of GodsLink | Cloud Developer',
    'Athena_Dev': '🦉 Puzzle Logic Designer | UI Engineer',
    'Poseidon_Dev': '🌊 Pixel Artist & Wave Simulator Enthusiast',
    'Hades_Gamer': '💀 Hardcore RPG fan | Speedrunning underworld titles',
    'NULL_Admin': '🛡️ Null Server Admin | Executive Creator ⚔️'
  };

  const rosterBanners: Record<string, string> = {
    'Zeus_God': 'ocean',
    'Athena_Dev': 'emerald',
    'Poseidon_Dev': 'ocean',
    'Hades_Gamer': 'void',
    'NULL_Admin': 'sunset'
  };

  // Custom Inline CSS Variables mapping for Theme Builder
  const customThemeVariables = activeTheme === 'custom' ? {
    '--color-discord-bg': settings.customBgColor,
    '--color-discord-sidebar': settings.customSidebarColor,
    '--color-discord-card': settings.customCardColor,
    '--color-discord-blurple': settings.customAccentColor,
  } as React.CSSProperties : {};

  // Roster activities
  const gamerActivities = [
    '🎮 Playing Hades Ascending',
    '🎮 testing beta v0.8',
    '💬 discussing gameplay',
    '🎮 Speedrunning',
  ];

  const developerActivities = [
    '🟢 Coding Patch v1.0.2',
    '🐛 Squash bug #432',
    '🟢 Compiling ZIP binary',
  ];

  const activeChannelObj = activeServer.channels.find(c => c.name === activeChannel);
  const isVoiceChannel = activeChannelObj?.type === 'voice';

  return (
    <div 
      style={customThemeVariables}
      className={`flex-1 flex flex-row min-h-0 ${style.bg} ${style.textLight} transition-colors duration-300 overflow-hidden ${settings.layoutDensity === 'compact' ? 'compact-ide' : ''}`}
    >
      
      {/* Mobile Sidebar Backdrop / Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 1st & 2nd COLUMNS Container (Mobile drawer overlay, desktop inline flex) */}
      <div className={`md:flex flex-row min-h-0 flex-shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
      } max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 transition-transform duration-300 h-full`}>
        
        {/* 1st COLUMN: Discord-Style Server Navigation Dock */}
        <aside className="w-16 bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0 border-r border-[#1e1f22] overflow-y-auto custom-scrollbar h-full">
          {/* GodsLink Hub / Storefront */}
          <div className="relative group">
            {activeServerId === 'godslink' && (
              <span className="absolute left-0 top-3 w-1 h-8 bg-white rounded-r-full" />
            )}
          <button 
            onClick={() => { setActiveServerId('godslink'); setActiveChannel('all-games'); }}
            className={`w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#2b2d31] hover:bg-[#5865f2] text-white flex items-center justify-center text-xl transition-all duration-200 overflow-hidden ${
              activeServerId === 'godslink' ? 'bg-[#5865f2] !rounded-2xl' : ''
            }`}
            title="GodsLink Storefront Hub"
          >
            ⚔️
          </button>
        </div>

        <div className="w-8 h-[2px] bg-[#2b2d31] my-1 rounded" />

        {/* Dynamic Server List */}
        {servers.filter(s => s.id !== 'godslink').map((srv) => {
          const isActive = activeServerId === srv.id;
          return (
            <div key={srv.id} className="relative group">
              {isActive && (
                <span className="absolute left-0 top-3 w-1 h-8 bg-white rounded-r-full" />
              )}
              <button 
                onClick={() => { setActiveServerId(srv.id); setActiveChannel(srv.channels[0].name); }}
                className={`w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#2b2d31] hover:bg-[#5865f2] text-white flex items-center justify-center text-lg font-black uppercase transition-all duration-200 overflow-hidden ${
                  isActive ? 'bg-[#5865f2] !rounded-2xl' : ''
                }`}
                title={srv.name}
              >
                {srv.logoUrl ? (
                  <img src={srv.logoUrl} alt={srv.name} className="w-full h-full object-cover" />
                ) : (
                  srv.icon
                )}
              </button>
            </div>
          );
        })}

        {/* Green "+" button to Add Server */}
        <button 
          onClick={() => setIsAddServerOpen(true)}
          className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#2b2d31] hover:bg-green-500 text-green-500 hover:text-white flex items-center justify-center text-2xl transition-all duration-200 mt-1"
          title="Create a Server"
        >
          +
        </button>
      </aside>

      {/* 2nd COLUMN: Channel Sidebar */}
      <aside className={`w-64 ${style.sidebar} flex flex-col justify-between flex-shrink-0 min-h-0 transition-colors duration-300`}>
        
        {/* Top: Active Server Brand Header */}
        <div className="p-4 border-b border-discord-card flex items-center justify-between flex-shrink-0 bg-discord-sidebar">
          <span className="font-extrabold tracking-wider text-white text-md truncate uppercase max-w-[130px] flex items-center gap-1.5 min-w-0">
            {activeServer.logoUrl ? (
              <img src={activeServer.logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="flex-shrink-0">{activeServer.icon}</span>
            )}
            <span className="truncate">{activeServer.name}</span>
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Server Settings gear icon (only for custom servers) */}
            {activeServerId !== 'godslink' && (
              <button 
                onClick={() => setIsServerSettingsOpen(true)}
                className="p-1 rounded hover:bg-discord-card text-discord-text-muted hover:text-white transition"
                title="Server Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <span className={`text-[10px] ${style.badge} font-bold px-2 py-0.5 rounded-full`}>
              {isStorefront ? 'STORE' : 'SERVER'}
            </span>
          </div>
        </div>

        {/* Middle: Navigation Channels List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className={`text-[10px] font-bold ${style.textMuted} uppercase tracking-wider block`}>
                {isStorefront ? 'Storefront Channels' : 'Text Channels'}
              </span>
              {/* Channel Creator button inside sidebar (visible to developers/admins) */}
              {isDev && (
                <button 
                  onClick={() => setIsAddChannelOpen(true)}
                  className="p-0.5 rounded hover:bg-discord-card text-discord-text-muted hover:text-white transition"
                  title="Create Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeServer.channels.map(chan => {
              const isActive = activeChannel === chan.name;
              return (
                <button 
                  key={chan.name}
                  onClick={() => handleChannelClick(chan)}
                  className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition text-left ${
                    isActive ? 'bg-discord-card text-white font-semibold shadow-sm border-l-2 border-[var(--color-discord-blurple)]' : `${style.textMuted} hover:bg-discord-card/50 hover:text-white`
                  }`}
                >
                  {chan.type === 'voice' ? (
                    <Volume2 className="w-4 h-4 text-discord-text-muted flex-shrink-0" />
                  ) : chan.type === 'announcement' ? (
                    <Sparkles className="w-4 h-4 text-discord-text-muted flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-discord-text-muted flex-shrink-0" />
                  )}
                  <span className="truncate">{chan.name}</span>
                </button>
              );
            })}
          </div>


        </div>

        {/* VOICE CONNECTION ACTIVE STATUS CARD */}
        {voiceConnection && (
          <div className="bg-[#232428] border-t border-discord-card p-3 flex flex-col gap-1.5 flex-shrink-0 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />
                <div className="min-w-0">
                  <span className="text-[9px] text-green-500 font-extrabold tracking-wider uppercase block">Voice Connected</span>
                  <span className="text-xs text-white font-bold truncate block max-w-[130px]">{voiceConnection.channelName}</span>
                </div>
              </div>
              <button 
                onClick={() => setVoiceConnection(null)}
                className="p-1 rounded bg-[#2b2d31] hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-[9px] font-bold px-2 py-0.5 transition"
                title="Disconnect Voice"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Bottom User status card with Instagram/LinkedIn bio card */}
        <div className="p-3 bg-discord-card border-t border-discord-sidebar flex items-center justify-between flex-shrink-0">
          <div 
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group relative"
            onMouseEnter={() => setHoveredUserId('currentUser')}
            onMouseLeave={() => setHoveredUserId(null)}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-discord-sidebar border border-discord-bg flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                {settings.avatarUrl ? (
                  <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  settings.avatar
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-discord-card" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-bold text-white truncate">
                {settings.displayName}
              </span>
              <span className={`text-[10px] ${style.textMuted} truncate`}>
                {settings.statusMessage || '🟢 Online'}
              </span>
            </div>

            {/* Custom Bio Hovercard with Banner decoration */}
            {hoveredUserId === 'currentUser' && (
              <div className="absolute bottom-12 left-0 w-64 bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden text-[#dbdee1] animate-in fade-in duration-200">
                {/* Custom Gradient Banner */}
                <div className={`h-12 bg-gradient-to-r ${bannerGradients[settings.profileBanner] || bannerGradients.sunset} flex-shrink-0`} />
                <div className="p-4 pt-0 relative -mt-6">
                  {/* Overlapping Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#1e1f22] border-4 border-[#1e1f22] flex items-center justify-center text-2xl shadow-md mb-2 overflow-hidden">
                    {settings.avatarUrl ? (
                      <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      settings.avatar
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block truncate">{settings.displayName}</span>
                    <span className="text-[9px] text-[#5865f2] uppercase tracking-wider font-extrabold">{settings.role}</span>
                  </div>
                  <div className="text-xs space-y-1 mt-3">
                    <span className="text-[9px] font-extrabold text-[#949ba4] uppercase tracking-wider block">Bio / Headline</span>
                    <p className="bg-[#2b2d31]/50 p-2 rounded border border-[#2b2d31] text-[10px] leading-relaxed text-white italic whitespace-normal mt-2">
                      {settings.bio || 'No bio configured yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-discord-sidebar text-discord-text-muted hover:text-white transition"
            title="User Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </aside>
    </div>

      {/* 3rd COLUMN: Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Mobile Top Header Bar */}
        <div className="h-12 bg-discord-sidebar border-b border-discord-card flex items-center justify-between px-3 md:hidden flex-shrink-0 text-white select-none">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1 rounded hover:bg-discord-card text-discord-text-muted hover:text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold truncate text-sm flex items-center gap-1.5 min-w-0 max-w-[180px]">
            {activeServer.logoUrl ? (
              <img src={activeServer.logoUrl} alt="Logo" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="flex-shrink-0 text-xs">{activeServer.icon}</span>
            )}
            <span className="truncate text-white">{activeServer.name}</span>
            <span className="text-discord-text-muted font-normal text-xs truncate">/ #{activeChannel}</span>
          </div>
          <button 
            onClick={() => setIsMobileRosterOpen(true)}
            className="p-1 rounded hover:bg-discord-card text-discord-text-muted hover:text-white transition"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Render STOREFRONT main display */}
        {isStorefront ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Search bar */}
            <div className="p-4 border-b border-discord-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 bg-discord-sidebar/20">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-discord-text-muted">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Search games or tags..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2]/80 focus:ring-1 focus:ring-[#5865f2]/80 rounded-md py-1.5 pl-9 pr-4 text-xs text-white placeholder-[#949ba4] outline-none transition"
                />
              </div>

              {/* Theme Settings Selector */}
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-discord-text-muted" />
                <span className="text-[10px] font-bold text-discord-text-muted uppercase">Themes:</span>
                <div className="flex items-center gap-1 bg-[#1e1f22] p-0.5 rounded border border-[#2b2d31]">
                  <button 
                    onClick={() => updateAppTheme('discord')}
                    className={`text-[9px] font-extrabold px-2 py-1 rounded transition ${
                      activeTheme === 'discord' ? 'bg-[#5865f2] text-white' : 'text-discord-text-muted hover:text-white'
                    }`}
                  >
                    Discord Dark
                  </button>
                  <button 
                    onClick={() => updateAppTheme('itch')}
                    className={`text-[9px] font-extrabold px-2 py-1 rounded transition ${
                      activeTheme === 'itch' ? 'bg-[#fa5c5c] text-white' : 'text-discord-text-muted hover:text-white'
                    }`}
                  >
                    Itch Retro
                  </button>
                  <button 
                    onClick={() => updateAppTheme('neon')}
                    className={`text-[9px] font-extrabold px-2 py-1 rounded transition ${
                      activeTheme === 'neon' ? 'bg-[#00ffcc] text-black' : 'text-[#00ffcc] hover:text-white'
                    }`}
                  >
                    Neon God
                  </button>
                  <button 
                    onClick={() => updateAppTheme('custom')}
                    className={`text-[9px] font-extrabold px-2 py-1 rounded transition ${
                      activeTheme === 'custom' ? 'bg-[var(--color-discord-blurple)] text-white' : 'text-discord-text-muted hover:text-white'
                    }`}
                  >
                    Custom Theme
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Store Grid list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Banner */}
              <div className="mb-6 p-6 bg-discord-card rounded-xl border border-discord-sidebar relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-discord-blurple/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-discord-blurple/15 border border-discord-blurple/25 text-discord-blurple text-[10px] font-extrabold uppercase py-0.5 px-3 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    <span>Real-time Gaming Storefront & Chat</span>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    The link between gods and gamers.
                  </h2>
                  <p className="text-sm text-discord-text-muted max-w-xl">
                    Discover and play community creations, and jump into real-time dev hotline channels on the same page.
                  </p>
                </div>
              </div>

              {/* Grid Header */}
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-discord-card">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-discord-blurple" />
                    <span>Explore Catalog</span>
                  </h3>
                  <p className={`text-xs ${style.textMuted}`}>Browse storefront games with responsive filters</p>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs bg-[#5865f2] hover:bg-[#4752c4] text-white px-3 py-1 rounded font-bold transition"
                  >
                    Reset Filter (x)
                  </button>
                )}
                <span className={`text-xs font-bold ${style.textMuted} bg-discord-card border border-discord-sidebar px-3 py-1 rounded-full`}>
                  {filteredGames.length} Games
                </span>
              </div>

              {/* Grid content */}
              {filteredGames.length === 0 ? (
                <div className="bg-discord-card border border-discord-sidebar rounded-xl p-12 text-center max-w-md mx-auto my-12 flex flex-col items-center">
                  <Gamepad2 className="w-12 h-12 text-discord-text-muted mb-4 animate-pulse" />
                  <h4 className="font-bold text-white">No Matching Games Found</h4>
                  <button onClick={() => setSearchQuery('')} className="mt-4 bg-[#5865f2] text-white px-4 py-1.5 rounded font-bold text-xs">Reset search</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
                  {filteredGames.map((game, idx) => (
                    <Link 
                      href={`/games/${game.id}`}
                      key={game.id} 
                      className={`group ${style.card} border border-transparent ${style.cardHover} rounded-lg p-4 flex flex-col justify-between transition duration-200`}
                    >
                      <div>
                        {/* Game Cover Art Container */}
                        <div className="aspect-video w-full bg-[#1e1f22] rounded-md flex flex-col items-center justify-center text-discord-text-muted border border-discord-bg relative overflow-hidden mb-3.5">
                          <div className="absolute inset-0 bg-[#5865f2]/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                          <Gamepad2 className="w-10 h-10 text-discord-text-muted group-hover:text-[#5865f2] transition duration-300 scale-100 group-hover:scale-105" />
                          <span className="text-[10px] text-discord-text-muted font-bold mt-2 tracking-widest uppercase">COVER ART</span>
                        </div>

                        <h4 className="font-extrabold text-md text-white group-hover:text-[#5865f2] transition line-clamp-1">
                          {game.title}
                        </h4>

                        <p className={`text-xs ${style.textMuted} line-clamp-2 mt-1.5 leading-relaxed mb-4`}>
                          {game.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Footer & Badges */}
                      <div className="space-y-3 mt-auto">
                        {/* Tags list: clicking a tag triggers local search query filter */}
                        <div className="flex flex-wrap gap-1">
                          {game.tags.map((tag: string) => (
                            <span 
                              key={tag} 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearchQuery(tag);
                              }}
                              className={`text-[9px] font-bold ${style.badge} px-2 py-0.5 rounded cursor-pointer hover:border-[#5865f2] transition`}
                              title={`Search by tag: ${tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-discord-card pt-3">
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[9px] ${style.textMuted} uppercase tracking-wider font-bold`}>Developer</span>
                            <span className="text-xs text-white font-bold truncate">{game.developer_username}</span>
                          </div>
                          <span className="p-1.5 bg-discord-card rounded hover:bg-discord-blurple text-discord-text-muted hover:text-white transition duration-200">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : isVoiceChannel ? (
          /* Render VOICE CHANNEL details visualizer */
          <div className="flex-1 flex flex-col bg-discord-bg items-center justify-center text-center p-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 animate-pulse">
              <Volume2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Voice Connection Active</h4>
              <p className="text-xs text-discord-text-muted mt-1">You are connected to #{activeChannel} voice channel.</p>
            </div>
            
            {/* Connected users list */}
            <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#2b2d31] w-full max-w-sm space-y-3">
              <span className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider block text-left">Connected Users</span>
              <div className="flex items-center justify-between text-xs text-white bg-[#2b2d31]/50 p-2.5 rounded border border-[#2d2f34]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-discord-card flex items-center justify-center text-xs">
                    {settings.avatar}
                  </div>
                  <span className="font-bold">{settings.displayName}</span>
                </div>
                <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-black tracking-wider uppercase">Speaking</span>
              </div>
              <div className="flex items-center justify-between text-xs text-discord-text-muted bg-[#2b2d31]/30 p-2.5 rounded border border-[#2d2f34]/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-discord-card flex items-center justify-center text-xs">🔱</div>
                  <span>NULL_Admin</span>
                </div>
                <span className="text-[9px] bg-discord-card text-discord-text-muted px-2 py-0.5 rounded">Muted</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setVoiceConnection(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs py-2 px-6 rounded-lg transition"
              >
                Disconnect Voice
              </button>
            </div>
          </div>
        ) : (
          /* Render CUSTOM SERVER text channel display */
          <div className="flex-1 flex flex-col bg-discord-bg">
            {/* Server Header */}
            <div className="p-4 border-b border-discord-card flex items-center justify-between bg-discord-sidebar/10 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Hash className="w-5 h-5 text-discord-text-muted" />
                <span className="font-extrabold text-white text-md">#{activeChannel}</span>
              </div>
            </div>

            {/* Server Chat Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {(serverMessages[activeChannel] || []).length === 0 ? (
                <div className="text-center text-discord-text-muted py-12">
                  <MessageSquare className="w-12 h-12 text-discord-card mx-auto mb-2 opacity-50" />
                  <h4 className="font-bold text-white text-sm">Welcome to #{activeChannel}!</h4>
                  <p className="text-xs">Be the first to post a message in this channel.</p>
                </div>
              ) : (
                (serverMessages[activeChannel] || []).map((msg) => (
                  <div key={msg.id} className="flex gap-3 hover:bg-discord-card/10 -mx-6 px-6 py-2 transition">
                    <div className="w-9 h-9 rounded-full bg-discord-card border border-discord-bg flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                      {msg.avatarUrl ? (
                        <img src={msg.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        msg.avatar || '👾'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold ${msg.role === 'developer' ? 'text-discord-blurple' : 'text-white'}`}>
                          {msg.username}
                        </span>
                        {msg.role === 'developer' && (
                          <span className="text-[8px] font-extrabold bg-[#5865f2]/10 border border-[#5865f2]/20 text-[#5865f2] px-1 rounded uppercase tracking-wider">DEV</span>
                        )}
                        <span className="text-[9px] text-discord-text-muted">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-discord-text-light mt-1 break-words leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Server Chat Input */}
            <div className="p-4 bg-discord-sidebar/10 border-t border-discord-card flex-shrink-0">
              <form onSubmit={handleSendServerMessage} className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder={`Message #${activeChannel}`}
                  value={serverInput}
                  onChange={(e) => setServerInput(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2]/80 focus:ring-1 focus:ring-[#5865f2]/80 rounded-lg py-2.5 pl-4 pr-12 text-sm text-white placeholder-discord-text-muted outline-none"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 p-1.5 bg-discord-blurple hover:bg-[#4752c4] text-white rounded-md transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Roster Backdrop / Overlay */}
      {isMobileRosterOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileRosterOpen(false)}
        />
      )}

      {/* 4th COLUMN: Active Community Roster */}
      <aside className={`w-60 bg-discord-sidebar border-l border-discord-card p-4 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0 min-h-0 transition-transform duration-300 max-md:fixed max-md:right-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:w-64 max-md:bg-[#2b2d31] max-md:shadow-2xl ${
        isMobileRosterOpen ? 'translate-x-0' : 'max-md:translate-x-full md:translate-x-0'
      }`}>
        
        {/* Mobile Roster Title Bar */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-xs font-bold text-white uppercase">Members Roster</span>
          <button 
            onClick={() => setIsMobileRosterOpen(false)}
            className="p-1 rounded hover:bg-discord-card text-discord-text-muted hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Render standard Roster if GodsLink Hub, otherwise show Custom Server Roster */}
        {isStorefront ? (
          <>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider block">
                Online Members ({initialProfiles?.length ? initialProfiles.length + 1 : 1})
              </span>
            </div>

            <div className="space-y-3">
              {/* Active User Card */}
              <div 
                className="flex flex-col gap-1 min-w-0 cursor-pointer group relative"
                onMouseEnter={() => setHoveredUserId('rosterCurrentUser')}
                onMouseLeave={() => setHoveredUserId(null)}
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-discord-card border border-discord-bg flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                      {settings.avatarUrl ? (
                        <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        settings.avatar
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-discord-sidebar" />
                  </div>
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${isDev ? 'text-discord-blurple' : 'text-discord-text-light'}`}>
                      {settings.displayName}
                    </span>
                    {isDev && (
                      <span className="text-[8px] font-extrabold bg-[#5865f2]/10 border border-[#5865f2]/20 text-[#5865f2] px-1 rounded uppercase tracking-wider flex-shrink-0">
                        Dev
                      </span>
                    )}
                  </div>
                </div>
                <div className="pl-9 min-w-0">
                  <span className="text-[10px] text-discord-text-muted block truncate bg-discord-card/50 px-2 py-0.5 rounded border border-discord-card w-fit max-w-full">
                    {settings.statusMessage || '🟢 Online'}
                  </span>
                </div>

                {/* Hover card bio details */}
                {hoveredUserId === 'rosterCurrentUser' && (
                  <div className="absolute right-0 bottom-4 w-60 bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden text-[#dbdee1] animate-in fade-in duration-200">
                    <div className={`h-10 bg-gradient-to-r ${bannerGradients[settings.profileBanner] || bannerGradients.sunset} flex-shrink-0`} />
                    <div className="p-4 pt-0 relative -mt-5">
                      <div className="w-10 h-10 rounded-full bg-[#1e1f22] border-4 border-[#1e1f22] flex items-center justify-center text-xl shadow-sm mb-2 overflow-hidden">
                        {settings.avatarUrl ? (
                          <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          settings.avatar
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block truncate">{settings.displayName}</span>
                      <span className="text-[8px] text-[#5865f2] uppercase tracking-wider font-extrabold">{settings.role}</span>
                      <p className="bg-[#2b2d31]/50 p-2 rounded border border-[#2b2d31] text-[10px] leading-relaxed text-white italic whitespace-normal mt-2">
                        {settings.bio || 'No bio configured yet.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Database online profiles */}
              {initialProfiles && initialProfiles.map((prof: any, idx: number) => {
                const isUserDev = prof.role === 'developer';
                const username = prof.username || 'user';
                const userAvatar = isUserDev ? '🔱' : '🎮';
                const activity = isUserDev 
                  ? developerActivities[idx % developerActivities.length]
                  : gamerActivities[idx % gamerActivities.length];

                const userBio = rosterBios[username] || (isUserDev ? '💻 Game developer at GodsLink | Code compiler' : '🎮 Casual player | Chatting in lobbies');
                const bannerKey = rosterBanners[username] || 'sunset';

                return (
                  <div 
                    key={prof.id} 
                    className="flex flex-col gap-1 min-w-0 cursor-pointer group relative"
                    onMouseEnter={() => setHoveredUserId(prof.id)}
                    onMouseLeave={() => setHoveredUserId(null)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-discord-card border border-discord-bg flex items-center justify-center text-xs font-bold text-discord-blurple uppercase">
                          {username[0]}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-discord-sidebar" />
                      </div>
                      
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isUserDev ? 'text-discord-blurple' : 'text-discord-text-light'}`}>
                          {username}
                        </span>
                        {isUserDev && (
                          <span className="text-[8px] font-extrabold bg-[#5865f2]/10 border border-[#5865f2]/20 text-[#5865f2] px-1 rounded uppercase tracking-wider flex-shrink-0">
                            Dev
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pl-9 min-w-0">
                      <span className="text-[10px] text-discord-text-muted block truncate bg-discord-card/50 px-2 py-0.5 rounded border border-discord-card w-fit max-w-full">
                        {activity}
                      </span>
                    </div>

                    {/* Hover card bio details */}
                    {hoveredUserId === prof.id && (
                      <div className="absolute right-0 bottom-4 w-60 bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden text-[#dbdee1] animate-in fade-in duration-200">
                        <div className={`h-10 bg-gradient-to-r ${bannerGradients[bannerKey]} flex-shrink-0`} />
                        <div className="p-4 pt-0 relative -mt-5">
                          <div className="w-10 h-10 rounded-full bg-[#1e1f22] border-4 border-[#1e1f22] flex items-center justify-center text-lg shadow-sm mb-2">{userAvatar}</div>
                          <span className="text-xs font-bold text-white block truncate">{username}</span>
                          <span className="text-[8px] text-[#5865f2] uppercase tracking-wider font-extrabold">{prof.role}</span>
                          <p className="bg-[#2b2d31]/50 p-2 rounded border border-[#2b2d31] text-[10px] leading-relaxed text-white italic whitespace-normal mt-2">
                            {userBio}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Render CUSTOM SERVER ROSTER (grouped by server roles and bots) */
          <div className="space-y-4">
            {/* Bots Group */}
            {(activeServer.bots || []).length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider block">
                  Bots ({(activeServer.bots || []).length})
                </span>
                {(activeServer.bots || []).map((bot: any) => (
                  <div key={bot.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-discord-card flex items-center justify-center text-md border border-discord-bg flex-shrink-0">
                      {bot.avatar}
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{bot.name}</span>
                      <span className="text-[8px] bg-discord-blurple/25 border border-discord-blurple/30 text-white font-extrabold px-1 rounded flex-shrink-0">BOT</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Server Roles Categories */}
            {(activeServer.roles || []).map((role) => {
              // Group some online users dynamically into server roles for testing
              const assignedUsers = role.name === 'ADMINS' || role.name === 'ADMIN'
                ? [settings.displayName === 'NULL_Admin' ? settings : { displayName: 'NULL_Admin', avatar: '🔱', statusMessage: '🛡️ Admin' }]
                : [settings.displayName !== 'NULL_Admin' ? settings : { displayName: 'Hades_Gamer', avatar: '💀', statusMessage: '🎮 Playing RPG' }];

              return (
                <div key={role.id} className="space-y-2">
                  <span className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider block">
                    {role.name} ({assignedUsers.length})
                  </span>
                  
                  {assignedUsers.map((usr: any, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-discord-card border border-discord-bg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                          {usr.avatarUrl ? (
                            <img src={usr.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            usr.avatar
                          )}
                        </div>
                        <span 
                          style={{ color: role.color }} 
                          className="text-xs font-bold truncate"
                        >
                          {usr.displayName}
                        </span>
                      </div>
                      <span className="pl-9 text-[10px] text-discord-text-muted truncate max-w-full block">
                        {usr.statusMessage || '🟢 Online'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

      </aside>

      {/* DISCORD-STYLE USER SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1f22]/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-10 text-[#dbdee1]">
          <div className="bg-[#2b2d31] w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-xl border border-[#1e1f22] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
            
            {/* Modal Sidebar */}
            <aside className="w-full md:w-60 bg-[#2b2d31] p-4 md:p-6 border-b md:border-r border-[#1e1f22] overflow-y-auto flex flex-col md:justify-between flex-shrink-0">
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-[#949ba4] uppercase tracking-wider block mb-2 px-2">
                  User Settings
                </span>
                
                <div className="space-y-0.5">
                  <button 
                    onClick={() => setActiveSettingsTab('identity')}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition ${
                      activeSettingsTab === 'identity' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    <span>👤 Gamer Identity</span>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('themes')}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition ${
                      activeSettingsTab === 'themes' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    <span>🎨 Custom App Themes</span>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('moderation')}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm font-semibold flex items-center justify-between transition ${
                      activeSettingsTab === 'moderation' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    <span>📢 Launch & Moderation</span>
                    {!isDev && <Lock className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('collab')}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm font-semibold flex items-center justify-between transition ${
                      activeSettingsTab === 'collab' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    <span>🛠️ Collaboration Engine</span>
                    {!isDev && <Lock className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('integrations')}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition ${
                      activeSettingsTab === 'integrations' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    <span>🔑 Core Integrations</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Modal Content */}
            <main className="flex-1 bg-[#313338] p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div>
                {/* 1. Identity Panel */}
                {activeSettingsTab === 'identity' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">👤 Gamer Identity Settings</h3>
                      <p className="text-xs text-[#949ba4] mt-1">Configure your online presence, profile bio, and display variables.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={settings.displayName}
                          onChange={(e) => updateSetting('displayName', e.target.value)}
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-md px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Custom Active Status Message</label>
                        <input 
                          type="text" 
                          value={settings.statusMessage}
                          onChange={(e) => updateSetting('statusMessage', e.target.value)}
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-md px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Instagram/LinkedIn Bio */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">Profile Bio (Instagram / LinkedIn style)</label>
                        <span className="text-[10px] text-[#949ba4] font-mono">{settings.bio.length} / 150</span>
                      </div>
                      <textarea 
                        value={settings.bio}
                        maxLength={150}
                        rows={3}
                        onChange={(e) => updateSetting('bio', e.target.value)}
                        placeholder="Write a headline or bio that wows others..."
                        className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-md px-3 py-2 text-sm text-white outline-none resize-none"
                      />
                    </div>

                    {/* Custom Profile Picture (URL or Local Upload) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Custom Profile Picture URL</label>
                        <input 
                          type="text" 
                          value={settings.avatarUrl}
                          onChange={(e) => updateSetting('avatarUrl', e.target.value)}
                          placeholder="Paste image link here..."
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Upload Local Image</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1500000) {
                                  alert('⚠️ Image is too large! Please choose an image under 1.5MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    updateSetting('avatarUrl', reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                            id="local-avatar-upload"
                          />
                          <label 
                            htmlFor="local-avatar-upload"
                            className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs py-2 px-4 rounded cursor-pointer transition w-full text-center"
                          >
                            Select Local Image
                          </label>
                          {settings.avatarUrl && (
                            <button 
                              type="button" 
                              onClick={() => updateSetting('avatarUrl', '')}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded text-xs transition"
                              title="Clear Image"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Banner Picker */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Configure Profile Banner Gradient</label>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.keys(bannerGradients).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateSetting('profileBanner', key)}
                            className={`h-12 rounded-lg bg-gradient-to-r ${bannerGradients[key]} border-2 transition flex items-center justify-center capitalize font-bold text-xs text-white shadow ${
                              settings.profileBanner === key ? 'border-white scale-105' : 'border-transparent hover:border-white/50'
                            }`}
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Role switcher */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Primary Persona Role Switcher</label>
                      <div className="grid grid-cols-2 gap-4 bg-[#1e1f22] p-1.5 rounded-lg border border-[#2b2d31]">
                        <button
                          onClick={() => updateSetting('role', 'gamer')}
                          className={`py-3 rounded font-bold flex flex-col items-center gap-1 transition ${
                            settings.role === 'gamer' ? 'bg-[#35373c] text-[#5865f2] border border-[#5865f2]/40' : 'text-[#949ba4] hover:text-white'
                          }`}
                        >
                          <Gamepad2 className="w-5 h-5" />
                          <span className="text-xs">Gamer View</span>
                        </button>
                        <button
                          onClick={() => updateSetting('role', 'developer')}
                          className={`py-3 rounded font-bold flex flex-col items-center gap-1 transition ${
                            settings.role === 'developer' ? 'bg-[#35373c] text-[#5865f2] border border-[#5865f2]/40' : 'text-[#949ba4] hover:text-white'
                          }`}
                        >
                          <User className="w-5 h-5" />
                          <span className="text-xs">Developer Workspace</span>
                        </button>
                      </div>
                    </div>

                    {/* Avatar choice */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Choose Avatar Badge / Profile Logo</label>
                      <div className="flex flex-wrap gap-2.5 bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                        {avatarChoices.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => updateSetting('avatar', emoji)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${
                              settings.avatar === emoji ? 'bg-[#5865f2] scale-110 shadow-lg' : 'bg-[#2b2d31] hover:bg-[#35373c]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout density */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Text Density Layout Selector</label>
                      <div className="flex items-center gap-4 bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#dbdee1]">
                          <input 
                            type="radio" 
                            name="density" 
                            checked={settings.layoutDensity === 'standard'}
                            onChange={() => updateSetting('layoutDensity', 'standard')}
                            className="text-[#5865f2] focus:ring-0 outline-none"
                          />
                          <span>Standard View</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#dbdee1]">
                          <input 
                            type="radio" 
                            name="density" 
                            checked={settings.layoutDensity === 'compact'}
                            onChange={() => updateSetting('layoutDensity', 'compact')}
                            className="text-[#5865f2] focus:ring-0 outline-none"
                          />
                          <span>Compact IDE Spacing</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOM APP THEME PANEL */}
                {activeSettingsTab === 'themes' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Palette className="w-5 h-5 text-discord-blurple" />
                        <span>Custom App Theme Builder</span>
                      </h3>
                      <p className="text-xs text-[#949ba4] mt-1">Configure hex-level color definitions to paint the application storefront.</p>
                    </div>

                    <div className="bg-[#1e1f22] p-4 rounded-lg border border-[#2b2d31] space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* App Background Color Picker */}
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">App Background Color</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={settings.customBgColor} 
                              onChange={(e) => updateSetting('customBgColor', e.target.value)} 
                              className="w-10 h-10 border border-[#2b2d31] rounded cursor-pointer bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={settings.customBgColor} 
                              onChange={(e) => updateSetting('customBgColor', e.target.value)} 
                              className="bg-[#313338] border border-[#2b2d31] rounded px-3 py-1.5 text-xs font-mono text-white outline-none w-28"
                            />
                          </div>
                        </div>

                        {/* Sidebar Color Picker */}
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Sidebar Color</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={settings.customSidebarColor} 
                              onChange={(e) => updateSetting('customSidebarColor', e.target.value)} 
                              className="w-10 h-10 border border-[#2b2d31] rounded cursor-pointer bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={settings.customSidebarColor} 
                              onChange={(e) => updateSetting('customSidebarColor', e.target.value)} 
                              className="bg-[#313338] border border-[#2b2d31] rounded px-3 py-1.5 text-xs font-mono text-white outline-none w-28"
                            />
                          </div>
                        </div>

                        {/* Card Color Picker */}
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Inner Card Background</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={settings.customCardColor} 
                              onChange={(e) => updateSetting('customCardColor', e.target.value)} 
                              className="w-10 h-10 border border-[#2b2d31] rounded cursor-pointer bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={settings.customCardColor} 
                              onChange={(e) => updateSetting('customCardColor', e.target.value)} 
                              className="bg-[#313338] border border-[#2b2d31] rounded px-3 py-1.5 text-xs font-mono text-white outline-none w-28"
                            />
                          </div>
                        </div>

                        {/* Accent Color Picker */}
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Accent / Interactivity Color</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={settings.customAccentColor} 
                              onChange={(e) => updateSetting('customAccentColor', e.target.value)} 
                              className="w-10 h-10 border border-[#2b2d31] rounded cursor-pointer bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={settings.customAccentColor} 
                              onChange={(e) => updateSetting('customAccentColor', e.target.value)} 
                              className="bg-[#313338] border border-[#2b2d31] rounded px-3 py-1.5 text-xs font-mono text-white outline-none w-28"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#2b2d31] flex justify-between items-center">
                        <span className="text-[10px] text-[#949ba4] font-bold">Activate this theme by choosing the **Custom Theme** option:</span>
                        <button
                          onClick={() => updateAppTheme('custom')}
                          className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-1.5 rounded font-bold text-xs transition"
                        >
                          Activate Custom Theme Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Moderation Panel */}
                {activeSettingsTab === 'moderation' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <span>📢 Launch & Moderation Settings</span>
                        {!isDev && <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider"><Lock className="w-2.5 h-2.5" /> LOCKED</span>}
                      </h3>
                    </div>
                    {!isDev ? (
                      <div className="bg-[#1e1f22]/50 border border-[#2b2d31] p-6 text-center rounded-lg">
                        <Lock className="w-10 h-10 text-orange-400 mx-auto opacity-50 mb-2" />
                        <h4 className="font-bold text-white">Developer Workspace Access Required</h4>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Game Binary Access Level Selector</label>
                          <select 
                            value={settings.accessLevel}
                            onChange={(e) => updateSetting('accessLevel', e.target.value)}
                            className="bg-[#1e1f22] border border-[#2b2d31] rounded-md px-3 py-2 text-sm text-white outline-none w-full"
                          >
                            <option value="public">Public Storefront (Everyone can play)</option>
                            <option value="alpha">Restricted Alpha (Authorized tester groups only)</option>
                            <option value="private">Private Draft (Developer only)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Hotline Channel Routing Toggles</label>
                          <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31] space-y-2.5">
                            <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                              <span>Enable Suggestion Boards (💡 Idea tab)</span>
                              <input type="checkbox" checked={settings.routingSuggestions} onChange={(e) => updateSetting('routingSuggestions', e.target.checked)} className="rounded text-[#5865f2]" />
                            </label>
                            <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                              <span>Enable Bug Tracking (🐛 Report Bug tab)</span>
                              <input type="checkbox" checked={settings.routingBugs} onChange={(e) => updateSetting('routingBugs', e.target.checked)} className="rounded text-[#5865f2]" />
                            </label>
                            <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                              <span>Enable General Lobbies (Chat tab)</span>
                              <input type="checkbox" checked={settings.routingGeneral} onChange={(e) => updateSetting('routingGeneral', e.target.checked)} className="rounded text-[#5865f2]" />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Automated Toxicity Text Filter</label>
                          <div className="flex items-center justify-between bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                            <span className="text-xs text-[#949ba4]">Auto-block messages containing slurs, hacks, or spam.</span>
                            <input type="checkbox" checked={settings.toxicityFilter} onChange={(e) => updateSetting('toxicityFilter', e.target.checked)} className="rounded text-[#5865f2] w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">Chat Slow-Mode Interval Slider</label>
                            <span className="text-xs font-bold text-[#5865f2]">{settings.slowMode === 0 ? 'Disabled' : `${settings.slowMode} seconds`}</span>
                          </div>
                          <div className="bg-[#1e1f22] p-4 rounded-lg border border-[#2b2d31]">
                            <input type="range" min="0" max="120" step="5" value={settings.slowMode} onChange={(e) => updateSetting('slowMode', parseInt(e.target.value))} className="w-full accent-[#5865f2]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Collab Panel */}
                {activeSettingsTab === 'collab' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <span>🛠️ Collaboration Engine Settings</span>
                      </h3>
                    </div>
                    {!isDev ? (
                      <div className="bg-[#1e1f22]/50 border border-[#2b2d31] p-6 text-center rounded-lg">
                        <Lock className="w-10 h-10 text-orange-400 mx-auto opacity-50 mb-2" />
                        <h4 className="font-bold text-white">Developer Workspace Access Required</h4>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31] flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold block text-white">IDE Markdown Syntax Highlighter</span>
                            </div>
                            <input type="checkbox" checked={settings.markdownHighlight} onChange={(e) => updateSetting('markdownHighlight', e.target.checked)} className="rounded text-[#5865f2] w-5 h-5" />
                          </div>
                          <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31] flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold block text-white">Roster LFG Broadcast Status</span>
                            </div>
                            <input type="checkbox" checked={settings.lfgBroadcast} onChange={(e) => updateSetting('lfgBroadcast', e.target.checked)} className="rounded text-[#5865f2] w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Project Vacancy Role Checklist</label>
                          <div className="grid grid-cols-3 gap-3 bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={settings.vacancyProgrammer} onChange={(e) => updateSetting('vacancyProgrammer', e.target.checked)} className="rounded text-[#5865f2]" />
                              <span>Programmer</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={settings.vacancySound} onChange={(e) => updateSetting('vacancySound', e.target.checked)} className="rounded text-[#5865f2]" />
                              <span>Sound Designer</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={settings.vacancyArtist} onChange={(e) => updateSetting('vacancyArtist', e.target.checked)} className="rounded text-[#5865f2]" />
                              <span>Artist</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Integrations Panel */}
                {activeSettingsTab === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">🔑 Core Integration Settings</h3>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">GitHub / GitLab Sync Portal</label>
                        <input type="text" value={settings.githubSync} onChange={(e) => updateSetting('githubSync', e.target.value)} className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-md px-3 py-2 text-sm text-white outline-none" />
                      </div>
                      <div className="flex items-center justify-between bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                        <div>
                          <span className="text-xs font-bold block text-white">Discord Rich Presence Connection Portal</span>
                        </div>
                        <input type="checkbox" checked={settings.discordPresence} onChange={(e) => updateSetting('discordPresence', e.target.checked)} className="rounded text-[#5865f2] w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 border-t border-[#1e1f22] pt-4">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs py-2 px-6 rounded transition">Save & Close</button>
              </div>
            </main>

            <div className="absolute top-6 right-6">
              <button onClick={() => setIsSettingsOpen(false)} className="flex flex-col items-center gap-1 group text-[#949ba4] hover:text-white">
                <div className="w-8 h-8 rounded-full border border-[#949ba4] group-hover:border-white flex items-center justify-center font-bold text-xs transition duration-200">✕</div>
                <span className="text-[9px] font-bold">ESC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCORD-STYLE SERVER SETTINGS MODAL */}
      {isServerSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1f22]/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 text-[#dbdee1]">
          <div className="bg-[#2b2d31] w-full max-w-4xl h-[75vh] rounded-xl border border-[#1e1f22] flex flex-row overflow-hidden shadow-2xl relative">
            
            {/* Server Settings Sidebar */}
            <aside className="w-56 bg-[#2b2d31] p-6 border-r border-[#1e1f22] overflow-y-auto flex flex-col justify-between flex-shrink-0">
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-[#949ba4] uppercase tracking-wider block px-2">
                  ⚙️ Server Settings
                </span>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => setActiveServerTab('overview')}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition ${
                      activeServerTab === 'overview' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveServerTab('roles')}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition ${
                      activeServerTab === 'roles' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    Roles Manager
                  </button>
                  <button 
                    onClick={() => setActiveServerTab('bots')}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition ${
                      activeServerTab === 'bots' ? 'bg-[#35373c] text-white' : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
                    }`}
                  >
                    Bots Catalog
                  </button>
                </div>
              </div>
            </aside>

            {/* Server Settings Right Content Panel */}
            <main className="flex-1 bg-[#313338] p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div>
                {/* A. Overview tab */}
                {activeServerTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Server Overview</h3>
                      <p className="text-xs text-[#949ba4] mt-1">Configure your custom community identity details.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Server Name</label>
                        <input 
                          type="text" 
                          value={activeServer.name}
                          onChange={(e) => handleUpdateServerOverview(e.target.value, activeServer.icon, activeServer.logoUrl || '')}
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Server Logo Emoji</label>
                        <input 
                          type="text" 
                          value={activeServer.icon}
                          onChange={(e) => handleUpdateServerOverview(activeServer.name, e.target.value, activeServer.logoUrl || '')}
                          placeholder="⚔️"
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none text-center"
                        />
                      </div>
                    </div>

                    {/* Custom Server Logo (URL or Local Upload) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Custom Server Logo URL</label>
                        <input 
                          type="text" 
                          value={activeServer.logoUrl || ''}
                          onChange={(e) => handleUpdateServerOverview(activeServer.name, activeServer.icon, e.target.value)}
                          placeholder="Paste logo image link here..."
                          className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Upload Local Image Logo</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1500000) {
                                  alert('⚠️ Image is too large! Please choose an image under 1.5MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    handleUpdateServerOverview(activeServer.name, activeServer.icon, reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                            id="local-server-logo-upload"
                          />
                          <label 
                            htmlFor="local-server-logo-upload"
                            className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs py-2 px-4 rounded cursor-pointer transition w-full text-center"
                          >
                            Select Local Logo
                          </label>
                          {activeServer.logoUrl && (
                            <button 
                              type="button" 
                              onClick={() => handleUpdateServerOverview(activeServer.name, activeServer.icon, '')}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded text-xs transition"
                              title="Clear Logo"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* B. Roles Manager Tab */}
                {activeServerTab === 'roles' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Roles Manager</h3>
                      <p className="text-xs text-[#949ba4] mt-1">Create and manage custom roles to group community members.</p>
                    </div>

                    {/* Role Creator Form */}
                    <form onSubmit={handleAddServerRole} className="bg-[#1e1f22] p-4 rounded-lg border border-[#2b2d31] flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-1.5">New Role Name</label>
                        <input 
                          type="text" 
                          required
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g. MODERATOR"
                          className="w-full bg-[#313338] border border-[#2b2d31] focus:border-[#5865f2] rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-1.5">Role Color</label>
                        <input 
                          type="color" 
                          value={newRoleColor}
                          onChange={(e) => setNewRoleColor(e.target.value)}
                          className="w-10 h-8 border border-[#2b2d31] rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded text-xs font-bold transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Roles List */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">Current Server Roles</label>
                      <div className="bg-[#1e1f22] rounded-lg border border-[#2b2d31] divide-y divide-[#2b2d31]">
                        {(activeServer.roles || []).map((role) => (
                          <div key={role.id} className="flex justify-between items-center p-3 text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <span style={{ backgroundColor: role.color }} className="w-3 h-3 rounded-full" />
                              <span style={{ color: role.color }}>{role.name}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteServerRole(role.id)}
                              className="text-red-500 hover:text-red-400 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* C. Bots Catalog Tab */}
                {activeServerTab === 'bots' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Bots Catalog</h3>
                      <p className="text-xs text-[#949ba4] mt-1">Invite utility bots to your server to enable custom automated greetings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableBots.map((bot) => {
                        const isInvited = (activeServer.bots || []).some(b => b.id === bot.id);
                        return (
                          <div key={bot.id} className="bg-[#1e1f22] p-4 rounded-lg border border-[#2b2d31] flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-2xl">{bot.avatar}</span>
                                <span className="text-[9px] bg-discord-blurple/25 border border-discord-blurple/30 px-2 py-0.5 rounded text-white font-bold">BOT</span>
                              </div>
                              <h4 className="font-extrabold text-sm text-white">{bot.name}</h4>
                              <p className="text-xs text-discord-text-muted mt-1 leading-relaxed">{bot.description}</p>
                            </div>
                            
                            <div className="mt-4 border-t border-[#2b2d31] pt-3">
                              {isInvited ? (
                                <button
                                  type="button"
                                  onClick={() => handleKickBot(bot.id)}
                                  className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-900/35 text-red-400 hover:text-red-300 font-bold text-xs py-1.5 rounded transition"
                                >
                                  Kick Bot
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleInviteBot(bot)}
                                  className="w-full bg-discord-blurple hover:bg-[#4752c4] text-white font-bold text-xs py-1.5 rounded transition"
                                >
                                  Invite to Server
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8 border-t border-[#1e1f22] pt-4">
                <button type="button" onClick={() => setIsServerSettingsOpen(false)} className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs py-2 px-6 rounded transition">Close Settings</button>
              </div>
            </main>

            {/* Float ESC to Close Server Settings */}
            <div className="absolute top-6 right-6">
              <button onClick={() => setIsServerSettingsOpen(false)} className="flex flex-col items-center gap-1 group text-[#949ba4] hover:text-white">
                <div className="w-8 h-8 rounded-full border border-[#949ba4] group-hover:border-white flex items-center justify-center font-bold text-xs transition duration-200">✕</div>
                <span className="text-[9px] font-bold">ESC</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE SERVER MODAL */}
      {isAddServerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateServer} className="bg-[#313338] border border-[#1e1f22] w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4 text-discord-text-light">
            <div className="flex justify-between items-center border-b border-discord-card pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Create your Server</h3>
              <button type="button" onClick={() => setIsAddServerOpen(false)} className="text-discord-text-muted hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Server Name</label>
              <input 
                type="text" 
                required
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="My Custom Server"
                className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Server Icon Emoji / Letter</label>
              <div className="grid grid-cols-6 gap-2">
                {['👾', '🔥', '🏆', '💎', '🛡️', '⚡'].map((emoji) => (
                  <button 
                    key={emoji}
                    type="button"
                    onClick={() => setNewServerIcon(emoji)}
                    className={`h-10 rounded font-bold text-lg border transition ${
                      newServerIcon === emoji ? 'bg-[#5865f2] border-[#5865f2] text-white' : 'bg-[#1e1f22] border-[#2b2d31] hover:bg-[#2b2d31]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button type="button" onClick={() => setIsAddServerOpen(false)} className="px-4 py-2 rounded text-xs font-bold hover:underline">Cancel</button>
              <button type="submit" className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-5 py-2 rounded text-xs font-bold transition">Create Server</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD CHANNEL MODAL */}
      {isAddChannelOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateChannel} className="bg-[#313338] border border-[#1e1f22] w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4 text-discord-text-light">
            <div className="flex justify-between items-center border-b border-discord-card pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Create Channel</h3>
              <button type="button" onClick={() => setIsAddChannelOpen(false)} className="text-discord-text-muted hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Channel Name</label>
              <input 
                type="text" 
                required
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="new-channel"
                className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">Channel Type</label>
              <div className="space-y-2 bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-white">
                  <input 
                    type="radio" 
                    name="chanType"
                    checked={newChannelType === 'text'}
                    onChange={() => setNewChannelType('text')}
                    className="text-[#5865f2] focus:ring-0 outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4 text-discord-text-muted" />
                    <span>Text Channel (Post messages and tag files)</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-white">
                  <input 
                    type="radio" 
                    name="chanType"
                    checked={newChannelType === 'voice'}
                    onChange={() => setNewChannelType('voice')}
                    className="text-[#5865f2] focus:ring-0 outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-discord-text-muted" />
                    <span>Voice Channel (Simulate voice room)</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-white">
                  <input 
                    type="radio" 
                    name="chanType"
                    checked={newChannelType === 'announcement'}
                    onChange={() => setNewChannelType('announcement')}
                    className="text-[#5865f2] focus:ring-0 outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-discord-text-muted" />
                    <span>Announcement Channel (Broadcast announcements)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button type="button" onClick={() => setIsAddChannelOpen(false)} className="px-4 py-2 rounded text-xs font-bold hover:underline">Cancel</button>
              <button type="submit" className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-5 py-2 rounded text-xs font-bold transition">Create Channel</button>
            </div>
          </form>
        </div>
      )}

      {/* PUBLISH GAME MODAL */}
      {isAddGameOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGame} className="bg-[#313338] border border-[#1e1f22] w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4 text-discord-text-light">
            <div className="flex justify-between items-center border-b border-discord-card pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <Gamepad2 className="w-5 h-5 text-discord-blurple" />
                <span>Publish Game Listing</span>
              </h3>
              <button type="button" onClick={() => setIsAddGameOpen(false)} className="text-discord-text-muted hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-1.5">Game Title</label>
              <input 
                type="text" 
                required
                value={newGameTitle}
                onChange={(e) => setNewGameTitle(e.target.value)}
                placeholder="e.g. Legend of Gods"
                className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-1.5">Description</label>
              <textarea 
                rows={3}
                value={newGameDescription}
                onChange={(e) => setNewGameDescription(e.target.value)}
                placeholder="Backstory, rules, controls, and download files info..."
                className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#949ba4] uppercase tracking-wider mb-1.5">Game Tags (Comma separated)</label>
              <input 
                type="text" 
                value={newGameTags}
                onChange={(e) => setNewGameTags(e.target.value)}
                placeholder="e.g. Action, RPG, HTML5"
                className="w-full bg-[#1e1f22] border border-[#2b2d31] focus:border-[#5865f2] rounded-md px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button type="button" onClick={() => setIsAddGameOpen(false)} className="px-4 py-2 rounded text-xs font-bold hover:underline">Cancel</button>
              <button type="submit" className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-5 py-2 rounded text-xs font-bold transition">Publish Game</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
