require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// CORS setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
};

app.use(require('cors')(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Warning: Missing Supabase credentials in environment variables!');
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Authenticate user with their Supabase JWT if provided
  const token = socket.handshake.auth.token;
  
  // Create a supabase client for this socket session.
  // If token is provided, authenticate as the user, otherwise use anon client.
  const supabaseOptions = token 
    ? { global: { headers: { Authorization: `Bearer ${token}` } } }
    : {};
  const socketSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

  // Join a game room
  socket.on('join_game', async ({ gameId }) => {
    if (!gameId) return;
    socket.join(gameId);
    console.log(`Socket ${socket.id} joined room ${gameId}`);
  });

  // Leave a game room
  socket.on('leave_game', ({ gameId }) => {
    if (!gameId) return;
    socket.leave(gameId);
    console.log(`Socket ${socket.id} left room ${gameId}`);
  });

  // Handle incoming chat messages
  socket.on('send_message', async ({ gameId, userId, message }) => {
    if (!gameId || !userId || !message) {
      socket.emit('error_message', 'Invalid message data');
      return;
    }

    try {
      // Commit message to database on behalf of the user
      const { data, error } = await socketSupabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          user_id: userId,
          message: message
        })
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
        .single();

      if (error) {
        console.warn('Error saving message to Supabase (falling back to temporary broadcast):', error.message || error);
        
        // Construct mock fallback message data to allow functional chat for mock users/in offline mode
        const isMockGod = userId === 'mock_god_zeus';
        const fallbackUsername = isMockGod ? 'Zeus_God' : (userId === 'mock_gamer_hades' ? 'Hades_Gamer' : 'Anonymous');
        const fallbackRole = isMockGod ? 'developer' : 'gamer';

        const fallbackData = {
          id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          game_id: gameId,
          user_id: userId,
          message: message,
          created_at: new Date().toISOString(),
          profiles: {
            username: fallbackUsername,
            role: fallbackRole
          }
        };

        io.to(gameId).emit('new_message', fallbackData);
        return;
      }

      // Broadcast the newly created message to all clients in the game room
      io.to(gameId).emit('new_message', data);
      console.log(`Message broadcasted to room ${gameId}:`, data.message);
    } catch (err) {
      console.error('Server error handling send_message:', err);
      socket.emit('error_message', 'Internal server error');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Real-time server listening on port ${PORT}`);
});
