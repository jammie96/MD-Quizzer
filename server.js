const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get list of available quiz files
app.get('/api/quizzes', async (req, res) => {
    try {
        const files = await fs.readdir('.');
        const quizFiles = files.filter(file => file.endsWith('.md'));
        res.json(quizFiles);
    } catch (error) {
        res.status(500).json({ error: 'Error reading quiz files' });
    }
});

// API endpoint to get quiz content
app.get('/api/quiz/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const content = await fs.readFile(filename, 'utf8');
        res.send(content);
    } catch (error) {
        res.status(500).json({ error: 'Error reading quiz file' });
    }
});

app.listen(port, () => {
    console.log(`Quiz app server running at http://localhost:${port}`);
}); 