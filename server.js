// server.js - Express endpoint
const express = require('express');
const fs = require('fs');
const app = express();

app.get('/log', (req, res) => {
    const data = {
        ip: req.ip,
        headers: req.headers,
        timestamp: new Date().toISOString()
    };
    
    fs.appendFile('visitors.log', JSON.stringify(data) + '\n', (err) => {
        if (err) console.error(err);
    });
    
    // Return the IP to the frontend
    res.json({ ip: req.ip });
});

app.listen(3000, () => console.log('Logger running on port 3000'));
