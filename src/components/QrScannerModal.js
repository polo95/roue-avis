import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { parseLotIdFromScan } from '../utils/parseQrScan';
import './QrScannerModal.css';

const SCANNER_ID = 'qr-scanner-region';

function QrScannerModal({ onClose }) {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState('');
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    const onScanSuccess = (decodedText) => {
      const lotId = parseLotIdFromScan(decodedText);

      if (!lotId) {
        setScanError('QR code non reconnu. Scannez un QR code de lot valide.');
        return;
      }

      scanner
        .stop()
        .then(() => {
          scanner.clear();
          navigate(`/validate/${lotId}`);
        })
        .catch(() => {
          navigate(`/validate/${lotId}`);
        });
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        onScanSuccess,
        () => {}
      )
      .then(() => {
        if (mounted) setIsStarting(false);
      })
      .catch((err) => {
        console.error('[QrScanner] Erreur caméra:', err);
        if (mounted) {
          setIsStarting(false);
          setScanError(
            'Impossible d\'accéder à la caméra. Autorisez l\'accès dans les paramètres du navigateur.'
          );
        }
      });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, [navigate]);

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // ignore cleanup errors
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="qr-scanner-overlay" role="presentation">
      <div className="qr-scanner-modal" role="dialog" aria-modal="true" aria-label="Scanner QR code">
        <div className="qr-scanner-header">
          <h2>Scanner un QR code</h2>
          <button type="button" className="qr-scanner-close" onClick={handleClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <p className="qr-scanner-hint">Placez le QR code du client dans le cadre</p>

        <div id={SCANNER_ID} className="qr-scanner-region" />

        {isStarting && <p className="qr-scanner-status">Ouverture de la caméra...</p>}
        {scanError && <p className="qr-scanner-error">{scanError}</p>}
      </div>
    </div>
  );
}

export default QrScannerModal;
