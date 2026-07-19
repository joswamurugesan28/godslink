import { notFound } from 'next/navigation';
import { Download, Gamepad2, ArrowLeft, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import ChatPanel from '@/components/ChatPanel';

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch game details along with developer username
  // Check if it's a placeholder game ID first
  const isPlaceholder = id.startsWith('placeholder-');
  let game: any = null;

  if (isPlaceholder) {
    const placeholders: Record<string, any> = {
      'placeholder-1': {
        id: 'placeholder-1',
        title: 'Hades Ascending',
        description: 'Brawl your way out of the underworld using legendary godly weapons and upgrades.',
        developer_id: 'mock_god_zeus',
        profiles: { username: 'Zeus_God' },
        created_at: new Date().toISOString(),
      },
      'placeholder-2': {
        id: 'placeholder-2',
        title: "Athena's Labyrinth",
        description: 'Test your intellect in the goddess\'s maze of traps, riddles, and ancient guardians.',
        developer_id: 'placeholder-athena',
        profiles: { username: 'Athena_Dev' },
        created_at: new Date().toISOString(),
      },
      'placeholder-3': {
        id: 'placeholder-3',
        title: "Poseidon's Odyssey",
        description: 'Navigate the deep oceans, fight legendary sea beasts, and control tidal storms.',
        developer_id: 'placeholder-poseidon',
        profiles: { username: 'Poseidon_Dev' },
        created_at: new Date().toISOString(),
      }
    };
    game = placeholders[id];
  } else {
    const { data: dbGame } = await supabase
      .from('games')
      .select(`
        id,
        title,
        description,
        file_url,
        created_at,
        developer_id,
        profiles (
          username
        )
      `)
      .eq('id', id)
      .single();
    game = dbGame;
  }

  if (!game) {
    notFound();
  }

  // 2. Fetch initial messages for pre-populating the chat screen
  let initialMessages: any[] = [];
  if (!isPlaceholder) {
    const { data: dbMessages } = await supabase
      .from('chat_messages')
      .select(`
        id,
        game_id,
        user_id,
        message,
        created_at,
        profiles (
          username,
          role
        )
      `)
      .eq('game_id', id)
      .order('created_at', { ascending: true });
    initialMessages = dbMessages || [];
  } else {
    // Custom initial greeting messages for placeholder games
    initialMessages = [
      {
        id: 'msg-p1',
        game_id: id,
        user_id: game.developer_id,
        message: `Welcome to the official lobby for ${game.title}! Feel free to report bugs or submit feature ideas here!`,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        profiles: { username: game.profiles.username, role: 'developer' }
      }
    ];
  }

  // 3. Fetch user auth & session details (checking mock cookie first)
  const cookieStore = await cookies();
  const mockSessionCookie = cookieStore.get('mock_session');
  let currentUser = null;
  let userProfile = null;
  let token = null;

  if (mockSessionCookie) {
    try {
      const mockSession = JSON.parse(decodeURIComponent(mockSessionCookie.value));
      currentUser = mockSession.user;
      userProfile = mockSession.profile;
      token = 'mock_jwt_token';
    } catch (e) {
      console.error('Error parsing mock session cookie:', e);
    }
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    token = session?.access_token || null;
    if (currentUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      userProfile = profile;
    }
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-discord-bg text-discord-text-light overflow-hidden">
      
      {/* Left Column: Game Profile Details */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar relative min-w-0">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-discord-blurple/5 blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-discord-text-muted hover:text-white font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>

          {/* Game Info Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-discord-card pb-8">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-discord-blurple rounded-2xl shadow-lg">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 truncate">{game.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-discord-text-muted">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-4 h-4 text-discord-blurple" />
                    <span>Developer: <strong className="text-white">{(game.profiles as any)?.username || 'Unknown'}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-discord-blurple" />
                    <span>Published: {new Date(game.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Download Button */}
            <a
              href={isPlaceholder ? '#' : `/api/games/${game.id}/download`}
              className="inline-flex items-center gap-2 bg-discord-blurple hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-xl shadow transition duration-200 self-start md:self-auto"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>Download Game</span>
            </a>
          </div>

          {/* About Section */}
          <div className="space-y-4 bg-discord-sidebar/40 border border-discord-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">About the Game</h2>
            <p className="text-discord-text-light leading-relaxed text-sm whitespace-pre-wrap">
              {game.description || 'No description provided for this game.'}
            </p>
          </div>

        </div>
      </div>

      {/* Right Column: Chat Panel */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 h-[500px] md:h-auto border-t md:border-t-0 md:border-l border-discord-card bg-discord-sidebar">
        <ChatPanel
          gameId={game.id}
          initialMessages={initialMessages}
          currentUser={currentUser}
          userProfile={userProfile}
          token={token}
          developerId={game.developer_id}
        />
      </div>

    </div>
  );
}
