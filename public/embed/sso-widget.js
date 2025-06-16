
(function() {
  'use strict';

  // HappyCoins SSO Widget
  window.HappyCoinsSSOWidget = {
    render: function(containerId, config) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('HappyCoins SSO Widget: Container element not found');
        return;
      }

      // Validate required config
      if (!config.clientId || !config.redirectUri) {
        console.error('HappyCoins SSO Widget: Missing required configuration (clientId, redirectUri)');
        return;
      }

      // Default configuration
      const defaultConfig = {
        scope: 'profile email',
        state: this.generateState(),
        appName: 'Application',
        theme: 'light',
        compact: false,
        onSuccess: function() {},
        onError: function() {}
      };

      const finalConfig = Object.assign({}, defaultConfig, config);

      // Create widget HTML
      const widgetHtml = this.createWidgetHTML(finalConfig);
      container.innerHTML = widgetHtml;

      // Attach event listeners
      this.attachEventListeners(container, finalConfig);

      // Check for auth callback on page load
      this.checkForAuthCallback(finalConfig);
    },

    generateState: function() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    createWidgetHTML: function(config) {
      const themeClass = config.theme === 'dark' ? 'hc-sso-dark' : 'hc-sso-light';
      const compactClass = config.compact ? 'hc-sso-compact' : '';

      return `
        <div class="hc-sso-widget ${themeClass} ${compactClass}">
          <style>
            .hc-sso-widget {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              max-width: ${config.compact ? '320px' : '400px'};
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: ${config.compact ? '16px' : '24px'};
              background: white;
            }
            .hc-sso-widget.hc-sso-dark {
              background: #1a1a1a;
              border-color: #374151;
              color: white;
            }
            .hc-sso-widget-header {
              display: flex;
              align-items: center;
              margin-bottom: ${config.compact ? '12px' : '16px'};
              font-size: ${config.compact ? '16px' : '18px'};
              font-weight: 600;
            }
            .hc-sso-widget-header svg {
              margin-right: 8px;
              width: 20px;
              height: 20px;
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
            .hc-sso-widget-field {
              margin-bottom: ${config.compact ? '12px' : '16px'};
            }
            .hc-sso-widget-label {
              display: block;
              margin-bottom: 4px;
              font-size: 14px;
              font-weight: 500;
              color: #374151;
            }
            .hc-sso-widget.hc-sso-dark .hc-sso-widget-label {
              color: #d1d5db;
            }
            .hc-sso-widget-value {
              font-size: 14px;
              color: #6b7280;
            }
            .hc-sso-widget.hc-sso-dark .hc-sso-widget-value {
              color: #9ca3af;
            }
            .hc-sso-widget-info {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 16px;
              font-size: 13px;
              color: #1d4ed8;
            }
            .hc-sso-widget.hc-sso-dark .hc-sso-widget-info {
              background: #1e3a8a;
              border-color: #3b82f6;
              color: #bfdbfe;
            }
            .hc-sso-widget-button {
              width: 100%;
              padding: ${config.compact ? '8px 16px' : '12px 24px'};
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: ${config.compact ? '14px' : '16px'};
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.2s;
            }
            .hc-sso-widget-button:hover {
              background: #2563eb;
            }
            .hc-sso-widget-button:disabled {
              background: #9ca3af;
              cursor: not-allowed;
            }
            .hc-sso-widget-button svg {
              margin-right: 8px;
              width: 16px;
              height: 16px;
            }
            .hc-sso-widget-message {
              margin-top: 12px;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 13px;
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
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
            }
            .hc-sso-widget.hc-sso-compact .hc-sso-widget-header {
              font-size: 14px;
            }
          </style>
          
          <div class="hc-sso-widget-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="m7,11 0,-5 c0,-1.5 1.5,-3 3,-3 1.5,0 3,1.5 3,3"/>
            </svg>
            Sign in with HappyCoins
            <span class="hc-sso-widget-badge">SSO</span>
          </div>

          ${!config.compact ? `
            <div class="hc-sso-widget-field">
              <span class="hc-sso-widget-label">Application:</span>
              <span class="hc-sso-widget-value">${config.appName}</span>
            </div>
            <div class="hc-sso-widget-field">
              <span class="hc-sso-widget-label">Permissions:</span>
              <span class="hc-sso-widget-value">${config.scope}</span>
            </div>
            <div class="hc-sso-widget-info">
              <strong>Secure Authentication:</strong> Sign in using your HappyCoins wallet credentials. 
              Your login information is encrypted and secure.
            </div>
          ` : ''}

          <button class="hc-sso-widget-button" id="hc-sso-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            ${config.compact ? 'Sign In' : 'Sign In with HappyCoins'}
          </button>

          <div id="hc-sso-message" class="hc-sso-widget-message" style="display: none;"></div>
        </div>
      `;
    },

    attachEventListeners: function(container, config) {
      const button = container.querySelector('#hc-sso-button');
      const messageDiv = container.querySelector('#hc-sso-message');

      button.addEventListener('click', function() {
        HappyCoinsSSOWidget.initiateAuth(button, messageDiv, config);
      });
    },

    checkForAuthCallback: function(config) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const returnedState = urlParams.get('state');

      if (code) {
        if (config.state && returnedState !== config.state) {
          this.showMessage(null, 'Invalid state parameter', 'error');
          config.onError('Invalid state parameter');
          return;
        }

        this.showMessage(null, 'Authentication successful!', 'success');
        config.onSuccess(code);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        this.showMessage(null, error, 'error');
        config.onError(error);
      }
    },

    initiateAuth: function(button, messageDiv, config) {
      // Disable button and show processing state
      button.disabled = true;
      button.innerHTML = `
        <svg style="margin-right: 8px; width: 16px; height: 16px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Redirecting...
      `;

      this.showMessage(messageDiv, 'Redirecting to HappyCoins authentication...', 'info');

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

        // Get the current domain for the auth URL
        const authUrl = window.location.origin + '/api/sso-auth/authorize?' + params.toString();
        
        // Redirect to auth endpoint
        window.location.href = authUrl;

      } catch (error) {
        this.showMessage(messageDiv, 'Failed to initiate authentication', 'error');
        this.resetButton(button, config);
        config.onError('Failed to initiate authentication');
      }
    },

    showMessage: function(messageDiv, text, type) {
      if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.textContent = text;
        messageDiv.className = `hc-sso-widget-message ${type}`;
      }
    },

    resetButton: function(button, config) {
      button.disabled = false;
      button.innerHTML = `
        <svg style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        ${config.compact ? 'Sign In' : 'Sign In with HappyCoins'}
      `;
    }
  };

  // Add CSS animation for spinner
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
})();
