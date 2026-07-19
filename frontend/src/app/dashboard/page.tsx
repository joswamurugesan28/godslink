'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Gamepad2, Plus, UploadCloud, Info, Trash2, ExternalLink, 
  Loader2, CheckCircle2, AlertTriangle, FileUp 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch developer profile and their games
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check role
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!currentProfile || currentProfile.role !== 'developer') {
        router.push('/');
        return;
      }

      setProfile(currentProfile);

      // Fetch owned games
      const { data: ownedGames } = await supabase
        .from('games')
        .select('*')
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      setGames(ownedGames || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      setFormError('Please provide a title and select a game file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFormError('');
    setFormSuccess('');

    try {
      // 1. Request presigned URL from API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to request upload signature.');
      }

      const { uploadUrl, key } = await response.json();

      // 2. Perform direct upload with progress monitoring
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(file);
      });

      // 3. Save game metadata to Supabase DB
      const { error: dbError } = await supabase
        .from('games')
        .insert({
          title: title.trim(),
          description: description.trim(),
          file_url: key,
          developer_id: profile.id,
        });

      if (dbError) throw dbError;

      // 4. Success cleanup
      setFormSuccess('Game uploaded and published successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setUploadProgress(0);
      loadDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This will also remove all associated chat messages.')) return;

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;
      setGames(games.filter(g => g.id !== gameId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete game.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading developer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-10 px-6 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              Developer Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">Publish new binaries and manage your storefront listings</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 self-start md:self-auto">
            <Gamepad2 className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-slate-300">Logged in as Dev: <strong className="text-white">{profile?.username}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to Upload Game */}
          <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-violet-400" />
              <span>Publish New Game</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 text-red-200 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5 animate-bounce" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateGame} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Game Title
                </label>
                <input
                  type="text"
                  required
                  disabled={uploading}
                  placeholder="Legend of Gods"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  disabled={uploading}
                  placeholder="Brief summary of the game, controls, backstory..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg py-2 px-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Game Binary / ZIP File
                </label>
                <div className={`mt-1 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition ${
                  file ? 'border-violet-500/50 bg-violet-950/10' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}>
                  <input
                    type="file"
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="hidden"
                    id="game-file-upload"
                  />
                  <label htmlFor="game-file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <FileUp className={`w-8 h-8 mb-2 ${file ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span className="text-xs text-slate-300 text-center font-medium">
                      {file ? file.name : 'Select binary or ZIP archive'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Secure upload using presigned URLs'}
                    </span>
                  </label>
                </div>
              </div>

              {uploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Uploading to storage...</span>
                    <span className="text-violet-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !title || !file}
                className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-sm transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading ({uploadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Publish</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: List of Published Games */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <span>Your Published Games ({games.length})</span>
            </h2>

            {games.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-8 text-center flex flex-col items-center">
                <Info className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-slate-400 font-medium">You haven&apos;t published any games yet.</p>
                <p className="text-xs text-slate-500 mt-1">Use the upload form to publish your first game!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game) => (
                  <div 
                    key={game.id}
                    className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-lg text-white line-clamp-1">{game.title}</h3>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-950 py-0.5 px-2 rounded-full border border-slate-800">
                          {game.id.substring(0, 8)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed">
                        {game.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-4 mt-auto">
                      <Link
                        href={`/games/${game.id}`}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold transition"
                      >
                        <span>View Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/35 text-red-400 hover:text-red-300 rounded transition"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
