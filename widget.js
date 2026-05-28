(function() {
    // --- 1. CONFIGURATION ---
    // Change this URL to the actual deployed Vercel URL
    const WIDGET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'index.html' 
        : 'https://kgtech-bot.vercel.app/'; // Placeholder - user replaces with final Vercel URL

    // --- 2. CREATE IFRAME ---
    const iframe = document.createElement('iframe');
    iframe.id = 'kgt-chatbot-iframe';
    iframe.src = WIDGET_URL;
    
    // Style the iframe initially to fit only the floating launcher button
    const initialStyles = {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '85px',
        height: '85px',
        border: 'none',
        zIndex: '9999999',
        background: 'transparent',
        colorScheme: 'light dark',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), bottom 0.3s, right 0.3s'
    };

    Object.assign(iframe.style, initialStyles);
    
    // Allow iframe interaction
    iframe.setAttribute('allow', 'microphone'); // If voice input is added in future
    
    // Append to body
    document.body.appendChild(iframe);

    // --- 3. HANDLE RESIZING VIA MESSAGES ---
    window.addEventListener('message', function(event) {
        // Verify message format
        if (event.data && event.data.type === 'kgt-chat-toggle') {
            const isOpen = event.data.isOpen;
            
            if (isOpen) {
                // Expanded chat window dimensions
                if (window.innerWidth <= 480) {
                    // Mobile fullscreen takeover
                    iframe.style.width = '100vw';
                    iframe.style.height = '100vh';
                    iframe.style.bottom = '0';
                    iframe.style.right = '0';
                } else {
                    // Desktop view dimensions
                    iframe.style.width = '420px';
                    iframe.style.height = '690px';
                    iframe.style.bottom = '10px';
                    iframe.style.right = '10px';
                }
            } else {
                // Collapsed launcher dimensions
                iframe.style.width = '85px';
                iframe.style.height = '85px';
                iframe.style.bottom = '10px';
                iframe.style.right = '10px';
            }
        }
    });

    // --- 4. HANDLE WINDOW RESIZE DURING OPEN CHAT ---
    window.addEventListener('resize', function() {
        const isChatOpen = iframe.style.width !== '85px';
        if (isChatOpen) {
            if (window.innerWidth <= 480) {
                iframe.style.width = '100vw';
                iframe.style.height = '100vh';
                iframe.style.bottom = '0';
                iframe.style.right = '0';
            } else {
                iframe.style.width = '420px';
                iframe.style.height = '690px';
                iframe.style.bottom = '10px';
                iframe.style.right = '10px';
            }
        }
    });
})();
