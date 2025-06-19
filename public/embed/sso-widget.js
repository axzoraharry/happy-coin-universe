
(function() {
  'use strict';

  // HappyCoins SSO Widget - Updated to handle CSP and iframe restrictions
  window.HappyCoinsSSOWidget = {
    render: function(containerId, config) {
      console.log('HappyCoins SSO Widget: Attempting to render in container:', containerId);
      
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('HappyCoins SSO Widget: Container element not found. Make sure an element with ID "' + containerId + '" exists in the DOM.');
        return;
      }

      // Validate required config
      if (!config || !config.clientId || !config.redirectUri) {
        console.error('HappyCoins SSO Widget: Missing required configuration. Required: clientId, redirectUri');
        return;
      }

      console.log('HappyCoins SSO Widget: Rendering with config:', config);

      // Default configuration
      const defaultConfig = Object.assign({}, {
        scope: 'profile email',
        state: this.generateState(),
        appName: 'Application',
        theme: 'light',
        compact: false,
        usePopup: false, // Default to full redirect to avoid iframe issues
        onSuccess: function(code) { console.log('SSO Success:', code); },
        onError: function(error) { console.error('SSO Error:', error); }
      }, config);

      // Create widget HTML
      const widgetHtml = this.createWidgetHTML(defaultConfig);
      container.innerHTML = widgetHtml;

      // Attach event listeners
      this.attachEventListeners(container, defaultConfig);

      // Check for auth callback on page load
      this.checkForAuthCallback(defaultConfig);

      console.log('HappyCoins SSO Widget: Successfully rendered');
    },

    renderWhenReady: function(containerId, config, maxRetries = 10, retryDelay = 100) {
      let retries = 0;
      
      const attemptRender = () => {
        const container = document.getElementById(containerId);
        if (container) {
          this.render(containerId, config);
        } else {
          retries++;
          if (retries < maxRetries) {
            console.log('HappyCoins SSO Widget: Container not found, retrying in ' + retryDelay + 'ms... (attempt ' + retries + '/' + maxRetries + ')');
            setTimeout(attemptRender, retryDelay);
          } else {
            console.error('HappyCoins SSO Widget: Container "' + containerId + '" not found after ' + maxRetries + ' attempts');
          }
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attemptRender);
      } else {
        attemptRender();
      }
    },

    generateState: function() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    createWidgetHTML: function(config) {
      const themeClass = config.theme === 'dark' ? 'hc-sso-dark' : 'hc-sso-light';
      const compactClass = config.compact ? 'hc-sso-compact' : '';

      // Create styles as a separate style element to avoid CSP issues
      const styleId = 'hc-sso-styles-' + Math.random().toString(36).substring(2, 9);
      
      return `
        <div class="hc-sso-widget ${themeClass} ${compactClass}" data-style-id="${styleId}">
          <div class="hc-sso-widget-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="m7,11 0,-5 c0,-1.5 1.5,-3 3,-3 1.5,0 3,1.5 3,3"/>
            </svg>
            Sign in with HappyCoins
            <span class="hc-sso-widget-badge">SSO</span>
          </div>

          <div class="hc-sso-widget-info">
            <strong>Secure Authentication:</strong> You will be redirected to HappyCoins for secure authentication.
          </div>

          <button class="hc-sso-widget-button" id="hc-sso-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Authorize with HappyCoins
          </button>

          <div id="hc-sso-message" class="hc-sso-widget-message" style="display: none;"></div>
        </div>
      `;
    },

    attachEventListeners: function(container, config) {
      const button = container.querySelector('#hc-sso-button');
      const messageDiv = container.querySelector('#hc-sso-message');

      if (!button || !messageDiv) {
        console.error('HappyCoins SSO Widget: Could not find required elements');
        return;
      }

      // Add styles programmatically to avoid CSP issues
      this.addStyles(container.dataset.styleId);

      button.addEventListener('click', function() {
        HappyCoinsSSOWidget.initiateAuth(button, messageDiv, config);
      });
    },

    addStyles: function(styleId) {
      // Check if styles already added
      if (document.getElementById('hc-sso-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'hc-sso-styles';
      style.textContent = `
        .hc-sso-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          max-width: 400px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          background: white;
          box-sizing: border-box;
        }
        .hc-sso-widget * { box-sizing: border-box; }
        .hc-sso-widget.hc-sso-dark {
          background: #1a1a1a;
          border-color: #374151;
          color: white;
        }
        .hc-sso-widget.hc-sso-compact {
          max-width: 320px;
          padding: 16px;
        }
        .hc-sso-widget-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
        }
        .hc-sso-widget.hc-sso-compact .hc-sso-widget-header {
          margin-bottom: 12px;
          font-size: 16px;
        }
        .hc-sso-widget-header svg {
          margin-right: 8px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .hc-sso-widget-badge {
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #1f2937;
          margin-left: auto;
          border: 1px solid #e2e8f0;
        }
        .hc-sso-widget.hc-sso-dark .hc-sso-widget-badge {
          background: #374151;
          color: white;
          border-color: #4b5563;
        }
        .hc-sso-widget-info {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 13px;
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #7dd3fc;
        }
        .hc-sso-widget-button {
          width: 100%;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .hc-sso-widget.hc-sso-compact .hc-sso-widget-button {
          padding: 8px 16px;
          font-size: 14px;
        }
        .hc-sso-widget-button:hover { background: #2563eb; }
        .hc-sso-widget-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .hc-sso-widget-button svg {
          margin-right: 8px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .hc-sso-widget-message {
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          word-break: break-word;
        }
        .hc-sso-widget-message.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .hc-sso-widget-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .hc-sso-widget-message.info {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #7dd3fc;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hc-sso-spin {
          animation: spin 1s linear infinite;
        }
      `;
      document.head.appendChild(style);
    },

    checkForAuthCallback: function(config) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const returnedState = urlParams.get('state');

      if (code) {
        if (config.state && returnedState !== config.state) {
          console.error('HappyCoins SSO Widget: Invalid state parameter');
          this.showMessage(null, 'Invalid state parameter', 'error');
          config.onError('Invalid state parameter');
          return;
        }

        console.log('HappyCoins SSO Widget: Authentication successful');
        this.showMessage(null, 'Authentication successful!', 'success');
        config.onSuccess(code);
        
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (error) {
        console.error('HappyCoins SSO Widget: Authentication error:', error);
        this.showMessage(null, 'Authentication failed: ' + error, 'error');
        config.onError(error);
      }
    },

    initiateAuth: function(button, messageDiv, config) {
      console.log('HappyCoins SSO Widget: Initiating authentication');
      
      button.disabled = true;
      button.innerHTML = `
        <svg class="hc-sso-spin" style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Redirecting...
      `;

      this.showMessage(messageDiv, 'Redirecting to HappyCoins for authentication...', 'info');

      try {
        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scope,
          response_type: 'code',
        });

        if (config.state) {
          params.append('state', config.state);
        }

        const baseUrl = this.getSupabaseUrl();
        const authUrl = baseUrl + '/functions/v1/sso-auth/authorize?' + params.toString();
        
        console.log('HappyCoins SSO Widget: Redirecting to authorization:', authUrl);

        // Use direct redirect to avoid iframe and CSP issues
        window.location.href = authUrl;

      } catch (error) {
        console.error('HappyCoins SSO Widget: Failed to initiate authentication:', error);
        this.showMessage(messageDiv, 'Failed to initiate authentication: ' + error.message, 'error');
        this.resetButton(button, config);
        config.onError('Failed to initiate authentication: ' + error.message);
      }
    },

    getSupabaseUrl: function() {
      return 'https://zygpupmeradizrachnqj.supabase.co';
    },

    showMessage: function(messageDiv, text, type) {
      if (!messageDiv) {
        messageDiv = document.querySelector('#hc-sso-message');
      }
      
      if (messageDiv) {
        messageDiv.style.display = text ? 'block' : 'none';
        messageDiv.textContent = text;
        messageDiv.className = `hc-sso-widget-message ${type}`;
      } else {
        console.log('HappyCoins SSO Widget Message (' + type + '):', text);
      }
    },

    resetButton: function(button, config) {
      if (!button) return;
      
      button.disabled = false;
      button.className = 'hc-sso-widget-button';
      button.innerHTML = `
        <svg style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Authorize with HappyCoins
      `;
    }
  };

  // Auto-initialization helper
  window.HappyCoinsSSOWidget.autoInit = function() {
    const autoInitElements = document.querySelectorAll('[data-happycoins-sso]');
    autoInitElements.forEach(function(element) {
      const config = {
        clientId: element.getAttribute('data-client-id'),
        redirectUri: element.getAttribute('data-redirect-uri'),
        scope: element.getAttribute('data-scope') || 'profile email',
        state: element.getAttribute('data-state'),
        appName: element.getAttribute('data-app-name') || 'Application',
        theme: element.getAttribute('data-theme') || 'light',
        compact: element.getAttribute('data-compact') === 'true',
        usePopup: element.getAttribute('data-use-popup') === 'true'
      };
      
      if (config.clientId && config.redirectUri) {
        window.HappyCoinsSSOWidget.render(element.id, config);
      }
    });
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.HappyCoinsSSOWidget.autoInit);
  } else {
    window.HappyCoinsSSOWidget.autoInit();
  }
})();
