const os = require('os'); // NEW: Grabs native operating system data

const SERVER_URL = 'http://127.0.0.1:5000/api/assets';

// NEW: Dynamically use the computer's actual name as the Serial Number!
const MY_SERIAL_NUMBER = os.hostname(); 
let assetId = null;

async function getMyRealIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (err) {
    try {
      const fallbackRes = await fetch('https://ipinfo.io/json');
      const fallbackData = await fallbackRes.json();
      return fallbackData.ip;
    } catch (fallbackErr) {
      console.log("⏳ [AGENT] Network transitioning... waiting.");
      return null;
    }
  }
}

async function startAgent() {
  console.log(`\n======================================================`);
  console.log(`💻 YOUR UNIQUE DEVICE ID IS:  ${MY_SERIAL_NUMBER}`);
  console.log(`======================================================\n`);
  console.log("⚙️ [AGENT] Booting up and checking VIP list...");
  
  try {
    const getRes = await fetch(SERVER_URL);
    const allAssets = await getRes.json();
    
    // Check if the IT Manager has added this specific computer's name yet
    const existingAgent = allAssets.find(asset => asset.description === MY_SERIAL_NUMBER);

    if (existingAgent) {
      assetId = existingAgent.id;
      console.log(`✅ [AGENT] Authorization confirmed! Linked to Database ID: ${assetId}`);
    } else {
      console.error(`❌ [AGENT] ACCESS DENIED: Device ID '${MY_SERIAL_NUMBER}' not found in HQ database.`);
      console.error(`➡️  ACTION REQUIRED: Go to the Dashboard, click '+ Register Asset', and enter '${MY_SERIAL_NUMBER}' as the Serial Number.`);
      
      // Keep the window open for 15 seconds so they can read the ID before it closes
      setTimeout(() => process.exit(1), 15000); 
      return; 
    }
  } catch (err) {
    console.error("❌ [AGENT] Failed to connect to HQ. Is your server running?");
    setTimeout(() => process.exit(1), 15000);
    return;
  }

  // The Real Heartbeat
  setInterval(async () => {
    const currentRealIp = await getMyRealIP();
    if (!currentRealIp) return;

    try {
      console.log(`📡 [AGENT] Sending heartbeat... (Real IP: ${currentRealIp})`);
      await fetch(`${SERVER_URL}/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'online', assetIp: currentRealIp })
      });
    } catch (err) {
      console.error("❌ [AGENT] Failed to reach HQ.");
    }
  }, 1000);
}

startAgent();