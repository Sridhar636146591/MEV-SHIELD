/**
 * MEV Detector Extension - Content Script
 * Injected into web pages to detect and protect transactions
 */

// Detect when user is on a DEX or DeFi platform
const SUPPORTED_DAPPS = [
  'app.uniswap.org',
  'pancakeswap.finance',
  'sushi.com',
  'curve.fi',
  'app.aave.com',
  'app.compound.finance',
];

let currentChainId = null;
let walletAddress = null;

// Listen for MetaMask or wallet events
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  // Detect wallet connection
  if (event.data.type && event.data.type === 'METAMASK_CONNECT') {
    walletAddress = event.data.address;
    console.log('[MEV Detector] Wallet connected:', walletAddress);
  }

  // Detect chain changes
  if (event.data.type && event.data.type === 'CHAIN_CHANGED') {
    currentChainId = event.data.chainId;
    console.log('[MEV Detector] Chain changed:', currentChainId);
  }
});

// Intercept transaction requests
const originalSend = XMLHttpRequest.prototype.send;
const originalOpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._url = url;
  return originalOpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
  this.addEventListener('loadend', () => {
    try {
      // Check if this is a transaction-related request
      if (this._url && this._url.includes('eth_sendTransaction')) {
        console.log('[MEV Detector] Transaction detected');
        
        // Parse the transaction data
        const txData = JSON.parse(body);
        analyzeTransaction(txData);
      }
    } catch (error) {
      // Ignore parsing errors
    }
  });

  return originalSend.apply(this, arguments);
};

/**
 * Analyze transaction for MEV risk
 */
async function analyzeTransaction(txData) {
  try {
    // Send to extension background script
    chrome.runtime.sendMessage({
      type: 'CHECK_TRANSACTION',
      payload: txData,
    }, (response) => {
      if (response && response.riskScore > 50) {
        showWarningOverlay(response);
      }
    });
  } catch (error) {
    console.error('[MEV Detector] Error analyzing transaction:', error);
  }
}

/**
 * Show warning overlay on the page
 */
function showWarningOverlay(riskData) {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'mev-detector-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 999999;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
        <h3 style="margin: 0; font-size: 18px;">MEV Risk Detected</h3>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px;">
          <div style="font-size: 14px; opacity: 0.9;">Risk Score</div>
          <div style="font-size: 28px; font-weight: bold;">${riskData.riskScore}%</div>
        </div>
      </div>
      
      <div style="font-size: 14px; margin-bottom: 15px; line-height: 1.5;">
        ${riskData.recommendation}
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button id="mev-protect-btn" style="
          flex: 1;
          background: #10B981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Protect with Flashbots</button>
        
        <button id="mev-dismiss-btn" style="
          flex: 1;
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        ">Dismiss</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add button event listeners
  document.getElementById('mev-protect-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'PROTECT_WITH_FLASHBOTS',
      payload: riskData.txData,
    });
    overlay.remove();
  });

  document.getElementById('mev-dismiss-btn').addEventListener('click', () => {
    overlay.remove();
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 30000);
}

// Inject wallet detection script
const injectScript = document.createElement('script');
injectScript.textContent = `
  // Detect MetaMask
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('connect', (info) => {
      window.postMessage({
        type: 'METAMASK_CONNECT',
        address: window.ethereum.selectedAddress
      }, '*');
    });

    window.ethereum.on('chainChanged', (chainId) => {
      window.postMessage({
        type: 'CHAIN_CHANGED',
        chainId: chainId
      }, '*');
    });
  }
`;
(document.head || document.documentElement).appendChild(injectScript);

console.log('[MEV Detector] Content script loaded and active');
