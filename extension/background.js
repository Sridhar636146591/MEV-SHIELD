/**
 * MEV Detector Extension - Background Service Worker
 * Handles communication between extension and backend API
 */

const API_BASE_URL = 'http://localhost:3001';

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse).catch(console.error);
  return true; // Keep message channel open for async response
});

async function handleMessage(request, sender) {
  const { type, payload } = request;

  switch (type) {
    case 'CHECK_TRANSACTION':
      return checkTransactionRisk(payload);
    
    case 'PROTECT_WITH_FLASHBOTS':
      return protectTransaction(payload);
    
    case 'GET_MEMPOOL_STATS':
      return getMempoolStats();
    
    case 'SET_ALERT_THRESHOLD':
      return setAlertThreshold(payload);
    
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

/**
 * Check transaction risk by calling backend API
 */
async function checkTransactionRisk(txData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Show notification if high risk
    if (result.riskScore > 70) {
      showRiskNotification(result);
    }

    return result;
  } catch (error) {
    console.error('Error checking transaction risk:', error);
    return { error: error.message };
  }
}

/**
 * Protect transaction using Flashbots
 */
async function protectTransaction(txData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashbots/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });

    return await response.json();
  } catch (error) {
    console.error('Error protecting transaction:', error);
    return { error: error.message };
  }
}

/**
 * Get current mempool statistics
 */
async function getMempoolStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mempool/stats`);
    return await response.json();
  } catch (error) {
    console.error('Error getting mempool stats:', error);
    return { error: error.message };
  }
}

/**
 * Set user's alert threshold
 */
async function setAlertThreshold(threshold) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ alertThreshold: threshold }, resolve);
  });
}

/**
 * Show risk notification to user
 */
function showRiskNotification(riskData) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '⚠️ High MEV Risk Detected',
    message: `Risk Score: ${riskData.riskScore}%\n${riskData.recommendation}`,
    priority: 2,
    buttons: [
      { title: 'Protect Now' },
      { title: 'View Details' }
    ]
  });
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Open popup with protection options
    chrome.runtime.openOptionsPage();
  } else if (buttonIndex === 1) {
    // Open dashboard with details
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
});

// Periodic mempool monitoring
chrome.alarms.create('mempoolCheck', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'mempoolCheck') {
    monitorMempool();
  }
});

async function monitorMempool() {
  try {
    const stats = await getMempoolStats();
    
    // Check if mempool congestion is high
    if (stats.pendingTxCount > 150000) {
      chrome.storage.local.get('alertThreshold', ({ alertThreshold }) => {
        if (!alertThreshold || alertThreshold < stats.pendingTxCount) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '📊 High Mempool Congestion',
            message: `${stats.pendingTxCount.toLocaleString()} pending transactions`,
          });
        }
      });
    }
  } catch (error) {
    console.error('Mempool monitoring error:', error);
  }
}

console.log('MEV Detector extension background service started');
