// Page Context Injection Script
// This script runs in the PAGE's JavaScript context (not the content script's isolated context)
// It loads the Ed widget IIFE bundle and initializes it in the real page window

(function() {
  'use strict';
  
  // Only run once - prevent double initialization
  if ((window as any).__ED_PAGE_SCRIPT_LOADED__) {
    console.debug('[Ed Page] Skipping – already loaded');
    return;
  }
  (window as any).__ED_PAGE_SCRIPT_LOADED__ = true;
  
  console.log('[Ed Page] Page context script injected');
  
  // Get extension ID from multiple sources (CSP-safe)
  let EXTENSION_ID = (window as any).__ED_EXTENSION_ID__;
  
  // If not set via window, try to get it from the script tag's data attribute
  if (!EXTENSION_ID) {
    const scriptTag = document.currentScript as HTMLScriptElement;
    if (scriptTag) {
      EXTENSION_ID = scriptTag.getAttribute('data-extension-id') || '';
    }
  }
  
  // If still not found, try to extract from the script src URL
  if (!EXTENSION_ID) {
    const scriptTag = document.currentScript as HTMLScriptElement;
    if (scriptTag && scriptTag.src) {
      const match = scriptTag.src.match(/chrome-extension:\/\/([^/]+)/);
      if (match) {
        EXTENSION_ID = match[1];
      }
    }
  }
  
  if (!EXTENSION_ID) {
    console.error('[Ed Page] Extension ID not found');
    return;
  }
  
  // Store it for later use
  (window as any).__ED_EXTENSION_ID__ = EXTENSION_ID;
  
  console.log('[Ed Page] Extension ID:', EXTENSION_ID);
  
  // Helper to send messages to content script
  function sendToContentScript(message: any) {
    window.postMessage({
      source: 'ed-page-script',
      extensionId: EXTENSION_ID,
      ...message
    }, '*');
  }
  
  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    // Security: Only accept messages from our extension
    if (event.data?.source !== 'ed-content-script' || event.data?.extensionId !== EXTENSION_ID) {
      return;
    }
    
    const { type, payload } = event.data;
    
    switch (type) {
      case 'INIT_WIDGET': {
        initWidget(payload);
        break;
      }
      case 'SET_TOOL_CONTEXT': {
        if (window.__ED_INSTANCE__?.setToolContext) {
          window.__ED_INSTANCE__.setToolContext(payload);
        }
        break;
      }
      case 'DESTROY_WIDGET': {
        if (window.__ED_INSTANCE__) {
          window.__ED_INSTANCE__.destroy();
          delete window.__ED_INSTANCE__;
        }
        break;
      }
    }
  });
  
  // Initialize the Ed widget
  async function initWidget(config: any) {
    try {
      console.log('[Ed Page] Initializing Ed widget with config:', {
        provider: config.provider,
        enableAI: config.enableAI,
        enableTTS: config.enableTTS,
        ttsProvider: config.ttsProvider,
        hasKeys: {
          openrouter: !!config.openRouterApiKey,
          gemini: !!config.geminiApiKey,
          fish: !!config.fishAudioApiKey,
        },
      });
      
      // CRITICAL: Set window.ED_CONFIG BEFORE loading the widget bundle
      // The widget reads this during initialization
      (window as any).ED_CONFIG = {
        provider: config.provider || 'openrouter',
        openRouterApiKey: config.openRouterApiKey,
        geminiApiKey: config.geminiApiKey,
        fishAudioApiKey: config.fishAudioApiKey,
        enableAI: config.enableAI !== false,
        enableTTS: config.enableTTS !== false,
        ttsProvider: config.ttsProvider || 'fish', // Default to Fish Audio
        schoolId: config.schoolId,
        language: config.language,
        persona: config.persona || 'edwina', // Default to Edwina voice
        // Fish Audio voice IDs (if provided)
        fishAudioVoiceIds: config.fishAudioVoiceIds || undefined,
      };
      
      console.log('[Ed Page] ✅ window.ED_CONFIG set before widget load');
      console.log('[Ed Page] Provider:', (window as any).ED_CONFIG.provider);
      console.log('[Ed Page] TTS:', (window as any).ED_CONFIG.enableTTS ? (window as any).ED_CONFIG.ttsProvider : 'disabled');
      
      // Get bundle URLs (using chrome-extension:// protocol)
      // Note: These URLs are constructed manually since we can't use chrome.runtime.getURL in page context
      const bundleUrl = `chrome-extension://${EXTENSION_ID}/ed-widget/ed-widget.iife.js`;
      const cssUrl = `chrome-extension://${EXTENSION_ID}/ed-widget/ed-widget.css`;
      
      console.log('[Ed Page] Loading bundle from:', bundleUrl);
      
      // Load CSS first
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
      console.log('[Ed Page] CSS loaded');
      
      // Load the IIFE bundle
      const script = document.createElement('script');
      script.src = bundleUrl;
      script.type = 'text/javascript';
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log('[Ed Page] Script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('[Ed Page] Script load error:', error);
          reject(new Error(`Failed to load Ed widget bundle from ${bundleUrl}`));
        };
        document.head.appendChild(script);
      });
      
      // Wait for EdWidget to be available
      console.log('[Ed Page] Waiting for EdWidget global...');
      let attempts = 0;
      const maxAttempts = 100; // Increased from 50 to 100 (10 seconds total)
      while (!window.EdWidget && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts % 10 === 0) {
          console.log(`[Ed Page] Still waiting for EdWidget... (${attempts}/${maxAttempts})`);
          // Log what's actually on window for debugging
          console.log('[Ed Page] window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('ed')));
        }
      }
      
      if (!window.EdWidget) {
        console.error('[Ed Page] EdWidget not found. window.EdWidget:', window.EdWidget);
        console.error('[Ed Page] Available window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('ed')));
        throw new Error('EdWidget not available after loading bundle');
      }
      
      console.log('[Ed Page] ✅ EdWidget found on window:', window.EdWidget);
      
      // Resolve the actual widget API from various bundler output shapes
      function resolveWidgetApi() {
        const g = window.EdWidget as any;
        
        // Direct assignment (ideal case)
        if (g?.init && typeof g.init === 'function') {
          console.log('[Ed Page] Found EdWidget API directly on window.EdWidget');
          return g;
        }
        
        // Module namespace: window.EdWidget.EdWidget
        if (g?.EdWidget?.init && typeof g.EdWidget.init === 'function') {
          console.log('[Ed Page] Found EdWidget API at window.EdWidget.EdWidget');
          return g.EdWidget;
        }
        
        // Default export: window.EdWidget.default
        if (g?.default?.init && typeof g.default.init === 'function') {
          console.log('[Ed Page] Found EdWidget API at window.EdWidget.default');
          return g.default;
        }
        
        // Ed export (less likely)
        if (g?.Ed?.init && typeof g.Ed.init === 'function') {
          console.log('[Ed Page] Found EdWidget API at window.EdWidget.Ed');
          return g.Ed;
        }
        
        console.error('[Ed Page] EdWidget API not found. Structure:', {
          hasInit: 'init' in g,
          hasEdWidget: 'EdWidget' in g,
          hasDefault: 'default' in g,
          hasEd: 'Ed' in g,
          keys: Object.keys(g),
        });
        
        return null;
      }
      
      const api = resolveWidgetApi();
      if (!api) {
        throw new Error('EdWidget API not found on window (no init method)');
      }
      
      // Initialize Ed
      const ed = api.init(config);
      window.__ED_INSTANCE__ = ed;
      
      console.log('[Ed Page] ✅ Ed widget initialized successfully');
      console.log('[Ed Page] Ed instance:', ed);
      
      // Notify content script that widget is ready
      sendToContentScript({
        type: 'WIDGET_READY',
        payload: { success: true }
      });
      
      // Watch for tool context changes from content script
      // (handled via message listener above)
      
    } catch (error) {
      console.error('[Ed Page] ❌ Error initializing widget:', error);
      sendToContentScript({
        type: 'WIDGET_ERROR',
        payload: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }
  
  // Notify content script that page script is ready
  sendToContentScript({
    type: 'PAGE_SCRIPT_READY',
    payload: { extensionId: EXTENSION_ID }
  });
  
  console.log('[Ed Page] Page context script ready, waiting for init command');
})();

