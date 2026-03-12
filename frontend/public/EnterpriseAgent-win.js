const os = require('os');

const BACKEND_URL = 'https://enterprise-asset-manager.onrender.com/api/assets';
const machineName = os.hostname(); 

async function startWindowsAgent() {
  console.log(`💻 Windows Enterprise Agent Active for: ${machineName}`);
  let assetId = null;

  try {
    const listRes = await fetch(BACKEND_URL);
    const assets = await listRes.json();
    const existingAsset = assets.find(a => a.name === machineName);

    if (existingAsset) {
      assetId = existingAsset.id;
    } else {
      const createRes = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: machineName,
          description: `Auto-registered Windows Agent`,
          category: 'Machine'
        })
      });
      const newAsset = await createRes.json();
      assetId = newAsset.id;
    }

    setInterval(async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();

        await fetch(`${BACKEND_URL}/${assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'online', assetIp: ip })
        });
        console.log(`📡 Ping sent from Windows (${ip})`);
      } catch (e) {
        console.log(`❌ Ping failed`);
      }
    }, 5000);

  } catch (err) {
    console.error("Agent Error:", err.message);
  }
}

startWindowsAgent();