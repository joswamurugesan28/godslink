import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import StorefrontClient from '@/components/StorefrontClient';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch all games from the database along with developer profiles
  const { data: games } = await supabase
    .from('games')
    .select(`
      id,
      title,
      description,
      file_url,
      created_at,
      profiles (
        username
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch profiles for the active community roster
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, role')
    .limit(20);

  // Check mock session cookie first for demo accounts
  const cookieStore = await cookies();
  const mockSessionCookie = cookieStore.get('mock_session');
  let userProfile = null;

  if (mockSessionCookie) {
    try {
      const mockSession = JSON.parse(decodeURIComponent(mockSessionCookie.value));
      userProfile = mockSession.profile;
    } catch (e) {
      console.error('Error parsing mock session cookie:', e);
    }
  } else {
    // Fallback to real Supabase session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      userProfile = profile;
    }
  }

  return (
    <StorefrontClient 
      initialGames={games || []}
      initialProfiles={profiles || []}
      initialUser={userProfile}
    />
  );
}
