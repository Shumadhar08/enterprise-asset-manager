import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function Scanner({ onScan }) {
  useEffect(() => {
    // Initialize the camera scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    // What to do when it successfully reads a code
    scanner.render(
      (decodedText) => {
        scanner.clear(); // Turn off the camera after a successful scan
        onScan(decodedText); // Send the text back to App.jsx
      },
      (error) => {
        // We ignore frame errors (it just means it hasn't found a code yet)
      }
    );

    // Cleanup function to stop the camera if we close the component
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScan]);

  return (
    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', color: 'black' }}>
      <div id="reader"></div>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>Point camera at QR Code</p>
    </div>
  );
}

export default Scanner;