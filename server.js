const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
        
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
