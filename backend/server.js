const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

app.get('/api/assets', async (req, res) => {
  try {
    const allAssets = await db.query('SELECT * FROM assets ORDER BY id ASC');
    res.status(200).json(allAssets.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const { name, description, category, expiration_date } = req.body; 
    
    const newAsset = await db.query(
      `INSERT INTO assets (name, description, status, location, maintenance_status, total_uptime_minutes, last_online_at, has_anomaly, category, expiration_date) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9) RETURNING *`,
      [name, description, 'online', 'Fairfax, Virginia', 'healthy', 0, false, category || 'Machine', expiration_date || null]
    );
    res.status(201).json(newAsset.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM assets WHERE id = $1', [id]);
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assetIp } = req.body; 

    const currentData = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
    const asset = currentData.rows[0];
    
    let newUptimeMinutes = parseFloat(asset.total_uptime_minutes) || 0;
    let newLocation = asset.location;
    let hasAnomaly = asset.has_anomaly;
    let lastOnlineAtQuery = asset.last_online_at;

    // Time tracking math
    if (asset.status === 'online' && asset.last_online_at) {
      const now = new Date();
      const lastOnline = new Date(asset.last_online_at);
      const diffInMinutes = (now - lastOnline) / 1000 / 60;
      newUptimeMinutes += diffInMinutes;
    }

    if (status === 'online') {
      lastOnlineAtQuery = new Date(); 
    }

    const totalSeconds = newUptimeMinutes * 60;
    let newMaintenanceStatus = 'healthy';
    
    if (totalSeconds >= 7) {
      newMaintenanceStatus = 'needs new laptop';
    } else if (totalSeconds >= 5) {
      newMaintenanceStatus = 'moderate';
    }

    // IP & Geolocation logic
    if (status === 'online') {
      if (assetIp) {
        try {
          const ipRes = await fetch(`http://ip-api.com/json/${assetIp}`);
          const ipData = await ipRes.json();
          if (ipData.status === 'success') {
            const remoteLocation = `${ipData.city}, ${ipData.regionName}`;
            if (remoteLocation !== 'Fairfax, Virginia') {
              hasAnomaly = true;
              newLocation = `BREACH DETECTED: ${remoteLocation}`;
            } else {
              hasAnomaly = false;
              newLocation = remoteLocation;
            }
          }
        } catch (e) {
          console.error("IP lookup failed");
        }
      } else {
         newLocation = 'Fairfax, Virginia';
         hasAnomaly = false;
      }
    } else {
      newLocation = 'OFFLINE';
    }

    const updatedAsset = await db.query(
      `UPDATE assets 
       SET status = $1, location = $2, has_anomaly = $3, total_uptime_minutes = $4, maintenance_status = $5, last_online_at = $6 
       WHERE id = $7 RETURNING *`,
      [status, newLocation, hasAnomaly, newUptimeMinutes, newMaintenanceStatus, lastOnlineAtQuery, id]
    );
    
    res.status(200).json(updatedAsset.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================================
// NEW: THE ZERO-TRUST WATCHDOG TIMER
// =====================================================================
setInterval(async () => {
  try {
    // Look at all machines currently marked as 'online'.
    // If their last heartbeat was more than 15 seconds ago, force them offline.
    await db.query(`
      UPDATE assets 
      SET status = 'offline' 
      WHERE status = 'online' 
      AND category = 'Machine' 
      AND last_online_at < NOW() - INTERVAL '15 seconds'
    `);
  } catch (err) {
    console.error("Watchdog sweep failed:", err);
  }
}, 5000); // The server sweeps the database every 5 seconds
// =====================================================================

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));