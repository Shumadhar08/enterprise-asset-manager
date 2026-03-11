import { useState, useEffect } from 'react';
import Scanner from './Scanner';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('library'); // Start on library view
  const [activeTab, setActiveTab] = useState('Machine');
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Machine'); 
  const [expirationDate, setExpirationDate] = useState(''); 
  const [isScanning, setIsScanning] = useState(false); 
  const [testIps, setTestIps] = useState({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchAssets = () => {
      fetch('http://127.0.0.1:5000/api/assets')
        .then((res) => res.json())
        .then((data) => setAssets(data))
        .catch((err) => console.error(err));
    };
    fetchAssets(); 
    const fetchInterval = setInterval(fetchAssets, 5000); 
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, expiration_date: expirationDate || null }),
      });
      const addedAsset = await response.json();
      setAssets([...assets, addedAsset]); 
      
      setName(''); setDescription(''); setCategory('Machine'); setExpirationDate('');
      setActiveTab(category);
      setCurrentView('library');
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id, currentStatus, customIp = null) => {
    const newStatus = currentStatus === 'online' && !customIp ? 'offline' : 'online';
    const payload = { status: newStatus };
    if (customIp) payload.assetIp = customIp;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updatedAsset = await response.json();
      setAssets(assets.map(asset => asset.id === id ? updatedAsset : asset));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAsset = async (id) => {
    await fetch(`http://127.0.0.1:5000/api/assets/${id}`, { method: 'DELETE' });
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const getHardwareBadgeStyle = (status) => {
    if (status === 'needs new laptop') return { bg: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c' }; 
    if (status === 'moderate') return { bg: 'rgba(243, 156, 18, 0.2)', color: '#f39c12' }; 
    return { bg: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71' }; 
  };

  const getExpiryBadge = (daysLeft) => {
    if (daysLeft < 0) return { text: 'EXPIRED', bg: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c' };
    if (daysLeft <= 30) return { text: 'EXPIRING SOON', bg: 'rgba(243, 156, 18, 0.2)', color: '#f39c12' };
    return { text: 'ACTIVE', bg: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71' };
  };

  const filteredAssets = assets.filter(asset => (asset.category || 'Machine') === activeTab);

  return (
    <div className="app-container">
      
      {/* --- SINGLE CORRECT NAVIGATION BAR --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0 }}>Enterprise Asset Manager</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          
          <a href="/EnterpriseAgent-win.exe" download style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#e67e22', color: 'white', textDecoration: 'none', border: 'none', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
            🪟 Win Agent
          </a>

          <a href="/EnterpriseAgent-macos" download style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#7f8c8d', color: 'white', textDecoration: 'none', border: 'none', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
            🍎 Mac Agent
          </a>

          <button onClick={() => setCurrentView('add')} style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentView === 'add' ? '#3498db' : 'transparent', color: currentView === 'add' ? 'white' : '#a8b2d1', border: currentView === 'add' ? 'none' : '1px solid #555', fontSize: '0.9rem' }}>
            ➕ Register
          </button>
          
          <button onClick={() => setCurrentView('library')} style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentView === 'library' ? '#3498db' : 'transparent', color: currentView === 'library' ? 'white' : '#a8b2d1', border: currentView === 'library' ? 'none' : '1px solid #555', fontSize: '0.9rem' }}>
            🗄️ Library
          </button>
        </div>
      </div>

      {/* --- ADD VIEW --- */}
      {currentView === 'add' && (
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Asset Registration Protocol</h3>
            <button onClick={() => setIsScanning(!isScanning)} style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
              {isScanning ? 'Close Camera' : '📷 Scan QR'}
            </button>
          </div>
          
          {isScanning && (
            <div style={{ marginBottom: '15px' }}>
              <Scanner onScan={(txt) => { setDescription(txt); setIsScanning(false); }} />
            </div>
          )}

          <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#222', color: 'white', border: '1px solid #444', fontSize: '1rem' }}>
              <option value="Machine">💻 Hardware / Machine</option>
              <option value="Certificate">🛡️ Security Certificate</option>
              <option value="Software">📦 Software License</option>
            </select>

            <input type="text" placeholder="Asset Name / Assignee" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#222', color: 'white', border: '1px solid #444' }} />
            <input type="text" placeholder="Serial Number / License Key" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#222', color: 'white', border: '1px solid #444' }} />
            
            {category !== 'Machine' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', color: '#a8b2d1' }}>Expiration Date</label>
                <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#222', color: 'white', border: '1px solid #444', colorScheme: 'dark' }} />
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ padding: '15px', fontSize: '1.1rem', marginTop: '10px' }}>+ Enter into Database</button>
          </form>
        </div>
      )}

      {/* --- LIBRARY VIEW --- */}
      {currentView === 'library' && (
        <div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            {['Machine', 'Certificate', 'Software'].map((tab) => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === tab ? '#222' : 'transparent', color: activeTab === tab ? '#00d2ff' : '#888', borderBottom: activeTab === tab ? '3px solid #00d2ff' : '3px solid transparent', transition: 'all 0.2s ease' }}>
                {tab === 'Machine' ? '💻 Machines' : tab === 'Certificate' ? '🛡️ Certificates' : '📦 Software'}
              </div>
            ))}
          </div>

          <div className="glass-panel">
            {filteredAssets.length === 0 ? (
              <p style={{ opacity: 0.7, textAlign: 'center', padding: '20px 0' }}>No {activeTab.toLowerCase()}s found in the database.</p>
            ) : (
              <ul className="asset-list">
                {filteredAssets.map((asset) => {
                  
                  let liveUptimeSeconds = Math.floor((parseFloat(asset.total_uptime_minutes) || 0) * 60);
                  if (asset.status === 'online' && asset.last_online_at) {
                    const elapsedSeconds = Math.floor((new Date().getTime() - new Date(asset.last_online_at).getTime()) / 1000);
                    liveUptimeSeconds += elapsedSeconds;
                  }
                  let liveMaintenanceStatus = 'healthy';
                  if (liveUptimeSeconds >= 7) liveMaintenanceStatus = 'needs new laptop';
                  else if (liveUptimeSeconds >= 5) liveMaintenanceStatus = 'moderate';
                  const hwBadge = getHardwareBadgeStyle(liveMaintenanceStatus);

                  let daysLeft = null;
                  let expiryBadge = null;
                  if (asset.category !== 'Machine' && asset.expiration_date) {
                     const expDate = new Date(asset.expiration_date);
                     daysLeft = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
                     expiryBadge = getExpiryBadge(daysLeft);
                  }

                  return (
                    <li key={asset.id} className="asset-item" style={{ borderLeftColor: asset.has_anomaly ? '#ff4d4d' : '#00d2ff' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <strong>{asset.name}</strong>
                          
                          {asset.category === 'Machine' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div onClick={() => toggleStatus(asset.id, asset.status)} style={{ width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer', backgroundColor: asset.status === 'online' ? '#2ecc71' : '#e74c3c', boxShadow: asset.status === 'online' ? '0 0 12px #2ecc71' : '0 0 12px #e74c3c', transition: 'all 0.3s ease' }}></div>
                              <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>{asset.status}</span>
                            </div>
                          )}
                          
                          {asset.category === 'Machine' ? (
                            <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: hwBadge.bg, color: hwBadge.color }}>
                              {liveMaintenanceStatus.toUpperCase()}
                            </span>
                          ) : (
                            expiryBadge && (
                              <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: expiryBadge.bg, color: expiryBadge.color }}>
                                {expiryBadge.text}
                              </span>
                            )
                          )}

                          {asset.has_anomaly && <span className="anomaly-badge">🚨 GEO-BREACH DETECTED</span>}
                        </div>
                        
                        <div style={{ fontSize: '0.85rem', color: asset.has_anomaly ? '#ff4d4d' : '#a8b2d1' }}>
                          <span>ID/Key: {asset.description}</span>
                          
                          {asset.category === 'Machine' ? (
                            <>
                              <span style={{ margin: '0 10px' }}>|</span>
                              <span>📍 {asset.location}</span>
                              <span style={{ margin: '0 10px' }}>|</span>
                              <span>⏱️ Lifetime Uptime: {liveUptimeSeconds} seconds</span>
                            </>
                          ) : (
                            <>
                              <span style={{ margin: '0 10px' }}>|</span>
                              <span>📅 Expiration: {new Date(asset.expiration_date).toLocaleDateString()}</span>
                              <span style={{ margin: '0 10px' }}>|</span>
                              <span>⏳ Days Remaining: {daysLeft}</span>
                            </>
                          )}
                        </div>

                        {activeTab === 'Machine' && (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '5px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            <input type="text" placeholder="Simulate Agent IP (e.g., 81.2.69.142)" value={testIps[asset.id] || ''} onChange={(e) => setTestIps({...testIps, [asset.id]: e.target.value})} style={{ padding: '6px', fontSize: '0.8rem', flex: 1, backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
                            <button onClick={() => toggleStatus(asset.id, 'offline', testIps[asset.id])} style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📡 Simulate Heartbeat</button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteAsset(asset.id)} className="btn-delete" style={{ height: 'fit-content' }}>Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;