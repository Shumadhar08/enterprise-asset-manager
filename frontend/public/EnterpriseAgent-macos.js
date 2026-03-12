const os = require('os');

const BACKEND_URL = 'https://enterprise-asset-manager.onrender.com/api/assets';
const machineName = os.hostname(); 

async function startAgent() {
  console.log(`🚀 Starting Enterprise Agent for: ${machineName}`);
  let assetId = null;

  try {
    const listRes = await fetch(BACKEND_URL);
    const assets = await listRes.json();
    const existingAsset = assets.find(a => a.name === machineName);

    if (existingAsset) {
      assetId = existingAsset.id;
      console.log(`✅ Found existing registration. Asset ID: ${assetId}`);
    } else {
      console.log(`🆕 New device detected. Registering to database...`);
      const createRes = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: machineName,
          description: `Auto-registered Mac Agent`,
          category: 'Machine'
        })
      });
      const newAsset = await createRes.json();
      assetId = newAsset.id;
      console.log(`✅ Successfully registered with Asset ID: ${assetId}`);
    }

    setInterval(async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();

        const pingRes = await fetch(`${BACKEND_URL}/${assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'online', assetIp: ip })
        });

        if (pingRes.ok) {
            console.log(`📡 Heartbeat sent: ${machineName} is ONLINE from ${ip}`);
        }
      } catch (e) {
        console.log(`❌ Heartbeat failed: ${e.message}`);
      }
    }, 5000);

  } catch (err) {
    console.error("Critical Agent Error:", err.message);
  }
}

startAgent();