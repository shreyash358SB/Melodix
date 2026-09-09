const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Temporary Cloud Store (Will be mapped to DB tables in full production)
let cloudLibrary = {
    likedSongs: [],
    recentlyPlayed: []
};

// YouTube API Search Endpoint
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API Key not configured' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(query)}&key=${apiKey}`;
        
        const response = await fetch(ytUrl);
        const data = await response.json();

        if (data.error) {
            return res.status(data.error.code || 500).json({ error: data.error.message });
        }

        const tracks = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        }));

        res.json({ success: true, tracks });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get User Library (Liked & History)
app.get('/api/library', (req, res) => {
    res.json({ success: true, library: cloudLibrary });
});

// Save Liked Song to Cloud
app.post('/api/library/like', (req, res) => {
    const track = req.body;
    if (!track || !track.videoId) {
        return res.status(400).json({ error: 'Invalid track data' });
    }
    
    // Check if already liked, toggle or add
    const exists = cloudLibrary.likedSongs.find(t => t.videoId === track.videoId);
    if (!exists) {
        cloudLibrary.likedSongs.unshift(track);
    } else {
        cloudLibrary.likedSongs = cloudLibrary.likedSongs.filter(t => t.videoId !== track.videoId);
    }
    
    res.json({ success: true, likedSongs: cloudLibrary.likedSongs });
});

app.listen(PORT, () => {
    console.log(`Melodix Cloud Server running on port ${PORT}`);
});
