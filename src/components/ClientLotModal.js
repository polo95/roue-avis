import { QRCodeSVG } from 'qrcode.react';
import config from '../config';
import CountdownTimer from './CountdownTimer';
import {
  STATUT,
  resolveLotStatus,
  getValidateUrl,
  getDaysUntilReplay,
  getHoursUntilActivation,
  formatFrenchDate,
  toDate,
} from '../services/participationService';
import DevTestButtons from './DevTestButtons';
import GoogleReviewButton from './GoogleReviewButton';
import './FortuneWheel.css';

function ClientLotModal({ lot, isNewWin, onClose }) {
  const status = resolveLotStatus(lot);
  const dateActivation = toDate(lot.dateActivation);
  const dateExpiration = toDate(lot.dateExpiration);
  const validateUrl = getValidateUrl(lot.id, config.appBaseUrl);
  const hoursLeft = getHoursUntilActivation(lot);
  const daysUntilReplay = getDaysUntilReplay(lot);

  const renderContent = () => {
    if (status === STATUT.EN_ATTENTE) {
      return (
        <>
          <div className="modal-badge modal-badge--pending">Lot réservé</div>
          <h2 className="modal-title">
            {isNewWin ? 'Votre lot est réservé !' : 'QR code bientôt disponible'}
          </h2>
          <p className="modal-subtitle">
            Revenez dans 24h minimum pour récupérer votre QR code
          </p>

          <div className="modal-prize-ticket">
            <div className="modal-prize">{lot.lot}</div>
          </div>

          <CountdownTimer
            targetAt={dateActivation}
            label="Activation du QR code dans"
          />

          <p className="modal-hint modal-hint--center">
            {hoursLeft > 0
              ? `Revenez dans ${hoursLeft} heure${hoursLeft > 1 ? 's' : ''} pour voir votre QR code`
              : 'Votre QR code sera bientôt disponible'}
          </p>

          <GoogleReviewButton />
        </>
      );
    }

    if (status === STATUT.ACTIF) {
      return (
        <>
          <div className="modal-badge modal-badge--active">QR code actif</div>
          <h2 className="modal-title">Votre QR code est prêt !</h2>

          <div className="qr-code-wrapper">
            <QRCodeSVG value={validateUrl} size={220} level="H" includeMargin />
          </div>

          <div className="modal-prize-ticket">
            <div className="modal-prize">{lot.lot}</div>
          </div>

          <div className="modal-cashier-notice">
            <svg viewBox="0 0 24 24" className="cashier-icon" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            <p>
              Montrez ce QR code au commerçant avec votre reçu de plus de 5€
            </p>
          </div>

          <p className="modal-deadline">
            Date limite de récupération : <strong>{formatFrenchDate(dateExpiration)}</strong>
          </p>

          <CountdownTimer
            targetAt={dateExpiration}
            label="Temps restant pour récupérer votre lot"
          />

          <GoogleReviewButton />
        </>
      );
    }

    if (status === STATUT.EXPIRE) {
      return (
        <>
          <div className="modal-badge modal-badge--expired">Lot expiré</div>
          <h2 className="modal-title">Votre lot a expiré</h2>
          <p className="modal-subtitle modal-subtitle--blocked">
            Le délai de récupération de 72h est dépassé.
          </p>

          <div className="modal-prize-ticket modal-prize-ticket--muted">
            <div className="modal-prize">{lot.lot}</div>
          </div>

          <p className="modal-hint modal-hint--center">
            {daysUntilReplay > 0
              ? `Revenez dans ${daysUntilReplay} jour${daysUntilReplay > 1 ? 's' : ''} pour rejouer`
              : 'Vous pouvez rejouer bientôt'}
          </p>
        </>
      );
    }

    if (status === STATUT.UTILISE) {
      return (
        <>
          <div className="modal-badge modal-badge--used">Lot utilisé</div>
          <h2 className="modal-title">Lot déjà récupéré</h2>
          <p className="modal-subtitle modal-subtitle--blocked">
            Ce lot a déjà été validé par le commerçant.
          </p>
          <div className="modal-prize-ticket modal-prize-ticket--muted">
            <div className="modal-prize">{lot.lot}</div>
          </div>
          <p className="modal-hint modal-hint--center">
            {daysUntilReplay > 0
              ? `Revenez dans ${daysUntilReplay} jour${daysUntilReplay > 1 ? 's' : ''} pour rejouer`
              : 'Vous pouvez rejouer bientôt'}
          </p>
        </>
      );
    }

    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
        {renderContent()}
        <DevTestButtons lot={lot} className="dev-test-buttons--modal" />
      </div>
    </div>
  );
}

export default ClientLotModal;
