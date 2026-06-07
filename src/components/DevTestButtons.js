import { useState } from 'react';
import {
  simulate24hActivation,
  simulate72hExpiration,
  resolveLotStatus,
  STATUT,
} from '../services/participationService';
import './DevTestButtons.css';

const IS_DEV = process.env.NODE_ENV === 'development';
const AUTO_OPEN_KEY = 'roue-avis-auto-open-lot';

function DevTestButtons({ lot, className = '' }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  if (!IS_DEV || !lot) return null;

  const status = resolveLotStatus(lot);
  const show24h = status === STATUT.EN_ATTENTE;
  const show72h = status === STATUT.ACTIF;

  if (!show24h && !show72h) return null;

  const reloadWithLotModal = () => {
    sessionStorage.setItem(AUTO_OPEN_KEY, '1');
    window.location.reload();
  };

  const handleSimulate24h = async () => {
    setLoading('24h');
    setError('');
    try {
      await simulate24hActivation(lot.id);
      reloadWithLotModal();
    } catch (err) {
      console.error(err);
      setError('Erreur simulation 24h');
      setLoading(null);
    }
  };

  const handleSimulate72h = async () => {
    setLoading('72h');
    setError('');
    try {
      await simulate72hExpiration(lot.id);
      reloadWithLotModal();
    } catch (err) {
      console.error(err);
      setError('Erreur simulation 72h');
      setLoading(null);
    }
  };

  return (
    <div className={`dev-test-buttons ${className}`.trim()}>
      <p className="dev-test-label">Outils de test (dev uniquement)</p>
      {show24h && (
        <button
          type="button"
          className="dev-test-button dev-test-button--24h"
          onClick={handleSimulate24h}
          disabled={loading !== null}
        >
          {loading === '24h' ? 'Simulation...' : 'SIMULER 24H (TEST)'}
        </button>
      )}
      {show72h && (
        <button
          type="button"
          className="dev-test-button dev-test-button--72h"
          onClick={handleSimulate72h}
          disabled={loading !== null}
        >
          {loading === '72h' ? 'Simulation...' : 'SIMULER 72H (TEST)'}
        </button>
      )}
      {error && <p className="dev-test-error">{error}</p>}
    </div>
  );
}

export { AUTO_OPEN_KEY };
export default DevTestButtons;
