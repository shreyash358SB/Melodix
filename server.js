// server.js — Production-Ready Melodix Backend
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database / Persistent Store Architecture (Ready for PostgreSQL/MongoDB mapping)
let appDatabase = {
    likedSongs: [],
    recentlyPlayed: [],
    playlists: [
        { id: 'p1', title: 'Desi Chill Vibe', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', tracks: [] },
        { id: 'p2', title: 'Late Night Drive', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', tracks: [] }
    ],
    comments: {}, // videoId -> Array of comments
    followedArtists: []
};

// YouTube API Search & Discovery Endpoint (Server-Side Secure Key Protection)
app.get('/api/search', async (req, res) => {
    const query = req.query.q || 'Top Indian Hits 2026';
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API Key not configured on server' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
        
        const response = await fetch(ytUrl);
        const data = await response.json();

        if (data.error) {
            const errCode = data.error.code || 500;
            if (errCode === 403 || errCode === 429) {
                return res.status(errCode).json({ error: 'YouTube API Quota exceeded or invalid key. Please try again later.' });
            }
            return res.status(errCode).json({ error: data.error.message });
        }

        const tracks = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
            publishedAt: item.snippet.publishedAt
        }));

        res.json({ success: true, tracks });
    } catch (err) {
        console.error('Backend API Error:', err);
        res.status(500).json({ error: 'Network failure or internal server error' });
    }
});

// Library & Likes Endpoints
app.get('/api/library', (req, res) => {
    res.json({ success: true, library: appDatabase });
});

app.post('/api/library/like', (req, res) => {
    const track = req.body;
    if (!track || !track.videoId) {
        return res.status(400).json({ error: 'Invalid track data' });
    }
    
    const exists = appDatabase.likedSongs.find(t => t.videoId === track.videoId);
    if (!exists) {
        appDatabase.likedSongs.unshift(track);
    } else {
        appDatabase.likedSongs = appDatabase.likedSongs.filter(t => t.videoId !== track.videoId);
    }
    
    res.json({ success: true, likedSongs: appDatabase.likedSongs });
});

// Playlists Endpoints
app.get('/api/playlists', (req, res) => {
    res.json({ success: true, playlists: appDatabase.playlists });
});

app.post('/api/playlists/create', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Playlist title required' });
    
    const newPlaylist = {
        id: 'pl_' + Date.now(),
        title,
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
        tracks: []
    };
    appDatabase.playlists.push(newPlaylist);
    res.json({ success: true, playlists: appDatabase.playlists });
});

// Comments Endpoints for Social Music Feature
app.get('/api/comments/:videoId', (req, res) => {
    const { videoId } = req.params;
    res.json({ success: true, comments: appDatabase.comments[videoId] || [] });
});

app.post('/api/comments/:videoId', (req, res) => {
    const { videoId } = req.params;
    const { user, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text required' });

    if (!appDatabase.comments[videoId]) {
        appDatabase.comments[videoId] = [];
    }
    const comment = { id: Date.now(), user: user || 'Music Lover', text, time: 'Just now' };
    appDatabase.comments[videoId].unshift(comment);
    res.json({ success: true, comments: appDatabase.comments[videoId] });
});

app.listen(PORT, () => {
    console.log(`Melodix Production Server running on port ${PORT}`);
});
