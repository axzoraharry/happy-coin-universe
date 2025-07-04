
(function() {
  'use strict';

  // HappyCoins Payment Widget
  window.HappyCoinsWidget = {
    render: function(containerId, config) {
      console.log('HappyCoins Widget: Attempting to render with container ID:', containerId);
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('HappyCoins Widget: Container element not found with ID:', containerId);
        console.log('HappyCoins Widget: Available elements with IDs:', 
          Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return false;
      }

      return this.renderWidget(container, config);
    },

    renderWhenReady: function(containerId, config, maxAttempts = 10) {
      console.log('HappyCoins Widget: Rendering when ready for container:', containerId);
      
      const attemptRender = (attempt = 1) => {
        console.log(`HappyCoins Widget: Render attempt ${attempt}/${maxAttempts}`);
        
        if (document.getElementById(containerId)) {
          console.log('HappyCoins Widget: Container found, rendering...');
          return this.render(containerId, config);
        }
        
        if (attempt < maxAttempts) {
          console.log('HappyCoins Widget: Container not found, retrying in 100ms...');
          setTimeout(() => attemptRender(attempt + 1), 100);
        } else {
          console.error('HappyCoins Widget: Failed to find container after', maxAttempts, 'attempts');
          console.log('HappyCoins Widget: DOM state:', document.readyState);
          console.log('HappyCoins Widget: Available elements with IDs:', 
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => attemptRender());
      } else {
        attemptRender();
      }
    },

    renderWidget: function(container, config) {
      // Validate required config
      if (!config.apiKey || !config.amount || !config.orderId) {
        console.error('HappyCoins Widget: Missing required configuration (apiKey, amount, orderId)');
        return false;
      }

      // Default configuration - use Supabase Edge Function endpoint
      const defaultConfig = {
        theme: 'light',
        compact: false,
        description: 'Payment',
        userEmail: '',
        apiUrl: 'https://zygpupmeradizrachnqj.supabase.co/functions/v1/wallet-payment',
        onSuccess: function() {},
        onError: function() {}
      };

      const finalConfig = Object.assign({}, defaultConfig, config);

      // Create widget HTML
      const widgetHtml = this.createWidgetHTML(finalConfig);
      container.innerHTML = widgetHtml;

      // Attach event listeners
      this.attachEventListeners(container, finalConfig);
      
      console.log('HappyCoins Widget: Successfully rendered');
      return true;
    },

    createWidgetHTML: function(config) {
      const themeClass = config.theme === 'dark' ? 'hc-dark' : 'hc-light';
      const compactClass = config.compact ? 'hc-compact' : '';

      return `
        <div class="hc-widget ${themeClass} ${compactClass}">
          <style>
            .hc-widget {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              max-width: ${config.compact ? '320px' : '400px'};
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: ${config.compact ? '16px' : '24px'};
              background: white;
            }
            .hc-widget.hc-dark {
              background: #1a1a1a;
              border-color: #374151;
              color: white;
            }
            .hc-widget-header {
              display: flex;
              align-items: center;
              margin-bottom: ${config.compact ? '12px' : '16px'};
              font-size: ${config.compact ? '16px' : '18px'};
              font-weight: 600;
            }
            .hc-widget-header svg {
              margin-right: 8px;
              width: 20px;
              height: 20px;
            }
            .hc-widget-amount {
              background: #f8fafc;
              padding: 8px 12px;
              border-radius: 6px;
              font-weight: 600;
              color: #1f2937;
              margin-left: auto;
            }
            .hc-widget.hc-dark .hc-widget-amount {
              background: #374151;
              color: white;
            }
            .hc-widget-field {
              margin-bottom: ${config.compact ? '12px' : '16px'};
            }
            .hc-widget-label {
              display: block;
              margin-bottom: 4px;
              font-size: 14px;
              font-weight: 500;
              color: #374151;
            }
            .hc-widget.hc-dark .hc-widget-label {
              color: #d1d5db;
            }
            .hc-widget-input {
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              background: white;
            }
            .hc-widget.hc-dark .hc-widget-input {
              background: #374151;
              border-color: #4b5563;
              color: white;
            }
            .hc-widget-button {
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
            .hc-widget-button:hover {
              background: #2563eb;
            }
            .hc-widget-button:disabled {
              background: #9ca3af;
              cursor: not-allowed;
            }
            .hc-widget-button svg {
              margin-right: 8px;
              width: 16px;
              height: 16px;
            }
            .hc-widget-message {
              margin-top: 12px;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 13px;
            }
            .hc-widget-message.success {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            .hc-widget-message.error {
              background: #fef2f2;
              color: #dc2626;
              border: 1px solid #fecaca;
            }
            .hc-widget-message.info {
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
            }
            .hc-widget.hc-compact .hc-widget-header {
              font-size: 14px;
            }
            .hc-pin-input {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .hc-pin-title {
              font-size: 16px;
              font-weight: 600;
              text-align: center;
            }
            .hc-pin-description {
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .hc-pin-fields {
              display: flex;
              gap: 8px;
              justify-content: center;
            }
            .hc-pin-digit {
              width: 48px;
              height: 48px;
              text-align: center;
              font-size: 18px;
              border: 2px solid #d1d5db;
              border-radius: 6px;
              background: white;
            }
            .hc-pin-digit:focus {
              outline: none;
              border-color: #3b82f6;
            }
            .hc-pin-buttons {
              display: flex;
              gap: 8px;
            }
            .hc-pin-button {
              flex: 1;
              padding: 8px 16px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              cursor: pointer;
              font-size: 14px;
            }
            .hc-pin-button.primary {
              background: #3b82f6;
              color: white;
              border-color: #3b82f6;
            }
          </style>
          
          <div class="hc-widget-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            HappyCoins Payment
            <span class="hc-widget-amount">${config.amount} HC</span>
          </div>

          <div id="hc-main-content">
            ${!config.compact ? `
              <div class="hc-widget-field">
                <span class="hc-widget-label">Description:</span>
                <span style="font-size: 14px; color: #6b7280;">${config.description}</span>
              </div>
              <div class="hc-widget-field">
                <span class="hc-widget-label">Order ID:</span>
                <span style="font-size: 14px; font-family: monospace;">${config.orderId}</span>
              </div>
            ` : ''}

            ${!config.userEmail ? `
              <div class="hc-widget-field">
                <label class="hc-widget-label" for="hc-email">Email Address</label>
                <input 
                  id="hc-email" 
                  type="email" 
                  class="hc-widget-input" 
                  placeholder="Enter your email"
                  required
                />
              </div>
            ` : ''}

            <button class="hc-widget-button" id="hc-pay-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Pay ${config.amount} HC
            </button>

            <div id="hc-message" class="hc-widget-message" style="display: none;"></div>
          </div>

          <div id="hc-pin-content" style="display: none;">
            <div class="hc-pin-input">
              <div class="hc-pin-title">Verify Payment</div>
              <div class="hc-pin-description">Enter your 4-digit PIN to complete the payment</div>
              <div class="hc-pin-fields">
                <input type="text" class="hc-pin-digit" maxlength="1" data-index="0">
                <input type="text" class="hc-pin-digit" maxlength="1" data-index="1">
                <input type="text" class="hc-pin-digit" maxlength="1" data-index="2">
                <input type="text" class="hc-pin-digit" maxlength="1" data-index="3">
              </div>
              <div class="hc-pin-buttons">
                <button class="hc-pin-button" id="hc-pin-cancel">Cancel</button>
                <button class="hc-pin-button primary" id="hc-pin-submit">Verify</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    attachEventListeners: function(container, config) {
      const button = container.querySelector('#hc-pay-button');
      const emailInput = container.querySelector('#hc-email');
      const messageDiv = container.querySelector('#hc-message');
      const mainContent = container.querySelector('#hc-main-content');
      const pinContent = container.querySelector('#hc-pin-content');
      const pinDigits = container.querySelectorAll('.hc-pin-digit');
      const pinSubmit = container.querySelector('#hc-pin-submit');
      const pinCancel = container.querySelector('#hc-pin-cancel');

      // Setup PIN input handling
      pinDigits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
          if (e.target.value.length === 1 && index < 3) {
            pinDigits[index + 1].focus();
          }
        });
        
        digit.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            pinDigits[index - 1].focus();
          }
        });
      });

      button.addEventListener('click', async function() {
        const email = config.userEmail || (emailInput ? emailInput.value : '');
        
        if (!email.trim()) {
          HappyCoinsWidget.showMessage(messageDiv, 'Email is required', 'error');
          return;
        }

        HappyCoinsWidget.processPayment(button, messageDiv, email, config, mainContent, pinContent);
      });

      pinSubmit.addEventListener('click', () => {
        const pin = Array.from(pinDigits).map(digit => digit.value).join('');
        if (pin.length === 4) {
          const email = config.userEmail || (emailInput ? emailInput.value : '');
          HappyCoinsWidget.processPayment(button, messageDiv, email, config, mainContent, pinContent, pin);
        }
      });

      pinCancel.addEventListener('click', () => {
        mainContent.style.display = 'block';
        pinContent.style.display = 'none';
        pinDigits.forEach(digit => digit.value = '');
        HappyCoinsWidget.resetButton(button, config);
        messageDiv.style.display = 'none';
      });
    },

    processPayment: async function(button, messageDiv, email, config, mainContent, pinContent, pin = null) {
      // Disable button and show processing state
      button.disabled = true;
      button.innerHTML = `
        <svg style="margin-right: 8px; width: 16px; height: 16px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Processing...
      `;

      this.showMessage(messageDiv, 'Processing payment...', 'info');

      try {
        console.log('HappyCoins Widget: Making API call to:', config.apiUrl);
        
        const requestBody = {
          external_order_id: config.orderId,
          user_email: email,
          amount: config.amount,
          description: config.description,
        };

        if (pin) {
          requestBody.user_pin = pin;
        }
        
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'Authorization': 'Bearer ' + (window.supabase?.auth?.session?.access_token || '')
          },
          body: JSON.stringify(requestBody),
        });

        // Handle non-2xx responses properly
        if (!response.ok) {
          let errorMessage = 'Payment failed';
          try {
            const errorData = await response.json();
            if (errorData.pin_required) {
              // Show PIN input
              mainContent.style.display = 'none';
              pinContent.style.display = 'block';
              this.showMessage(messageDiv, 'PIN verification required', 'info');
              button.disabled = false;
              this.resetButton(button, config);
              return;
            }
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse the error response, use a generic message
            errorMessage = `Payment failed (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result.success) {
          this.showMessage(messageDiv, 'Payment completed successfully!', 'success');
          button.innerHTML = `
            <svg style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            Payment Complete
          `;
          // Hide PIN input if showing
          if (pinContent.style.display !== 'none') {
            mainContent.style.display = 'block';
            pinContent.style.display = 'none';
          }
          config.onSuccess(result);
        } else if (result.pin_required) {
          // Show PIN input
          mainContent.style.display = 'none';
          pinContent.style.display = 'block';
          this.showMessage(messageDiv, 'PIN verification required', 'info');
          button.disabled = false;
          this.resetButton(button, config);
        } else {
          this.showMessage(messageDiv, result.error || 'Payment failed', 'error');
          this.resetButton(button, config);
          config.onError(result.error || 'Payment failed');
        }
      } catch (error) {
        console.error('HappyCoins Widget: API call failed:', error);
        this.showMessage(messageDiv, error.message || 'Network error occurred', 'error');
        this.resetButton(button, config);
        config.onError(error.message || 'Network error occurred');
      }
    },

    showMessage: function(messageDiv, text, type) {
      messageDiv.style.display = 'block';
      messageDiv.textContent = text;
      messageDiv.className = `hc-widget-message ${type}`;
    },

    resetButton: function(button, config) {
      button.disabled = false;
      button.innerHTML = `
        <svg style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        Pay ${config.amount} HC
      `;
    }
  };

  // Auto-initialization for data attributes
  function autoInitialize() {
    const elements = document.querySelectorAll('[data-happycoins-payment]');
    console.log('HappyCoins Widget: Found', elements.length, 'elements for auto-initialization');
    
    elements.forEach(element => {
      const config = {
        apiKey: element.dataset.apiKey,
        amount: parseFloat(element.dataset.amount),
        orderId: element.dataset.orderId,
        description: element.dataset.description || 'Payment',
        userEmail: element.dataset.userEmail || '',
        theme: element.dataset.theme || 'light',
        compact: element.dataset.compact === 'true',
        apiUrl: element.dataset.apiUrl || 'https://zygpupmeradizrachnqj.supabase.co/functions/v1/wallet-payment'
      };

      if (config.apiKey && config.amount && config.orderId) {
        console.log('HappyCoins Widget: Auto-initializing element with ID:', element.id);
        // Create a temporary container div inside the element
        const container = document.createElement('div');
        element.appendChild(container);
        HappyCoinsWidget.renderWidget(container, config);
      } else {
        console.error('HappyCoins Widget: Missing required data attributes for auto-initialization');
      }
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }

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
