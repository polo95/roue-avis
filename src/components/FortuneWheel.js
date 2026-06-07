import { useState, useRef, useMemo, useEffect } from 'react';
import config, { formatMessage } from '../config';
import { launchConfetti } from '../utils/confetti';
import wheelSound from '../utils/wheelSound';
import { generateFingerprint } from '../utils/fingerprint';
import {
  canParticipate,
  createLot,
  getLotByEmpreinte,
  isFingerprintLocked,
  STATUT,
  resolveLotStatus,
} from '../services/participationService';
import ClientLotModal from './ClientLotModal';
import DevTestButtons, { AUTO_OPEN_KEY } from './DevTestButtons';
import './FortuneWheel.css';

const SPIN_DURATION_MS = 3000;
const WHEEL_SIZE = 340;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = CENTER - 8;

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeSegment(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function buildThemeStyle(colors) {
  const { background, accent, titleGradient } = colors;

  return {
    '--bg-from': background.from,
    '--bg-via': background.via,
    '--bg-to': background.to,
    '--accent-primary': accent.primary,
    '--accent-secondary': accent.secondary,
    '--title-gradient': titleGradient.join(', '),
    '--pointer-color': colors.pointer,
    '--segment-border': colors.segmentBorder,
    '--segment-text': colors.segmentText,
    '--wheel-ring': colors.wheelRing,
    '--wheel-center': colors.wheelCenter,
    '--wheel-center-border': colors.wheelCenterBorder,
    '--wheel-center-dot': colors.wheelCenterDot,
  };
}

function FortuneWheel() {
  const { businessName, logo, welcomeMessage, subtitle, prizes, colors } = config;

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasLot, setHasLot] = useState(false);
  const [currentLot, setCurrentLot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isNewWin, setIsNewWin] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [checkError, setCheckError] = useState('');

  const spinTimeoutRef = useRef(null);
  const confettiCleanupRef = useRef(null);

  const themeStyle = useMemo(() => buildThemeStyle(colors), [colors]);
  const welcomeText = formatMessage(welcomeMessage, businessName);
  const segmentAngle = 360 / prizes.length;

  const loadClientLot = async (fp) => {
    const lot = await getLotByEmpreinte(fp.hash);
    if (lot && isFingerprintLocked(lot)) {
      setCurrentLot(lot);
      setHasLot(true);
      return lot;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const fp = await generateFingerprint();
        if (!mounted) return;
        setFingerprint(fp);
        const lot = await loadClientLot(fp);
        if (!mounted) return;

        if (sessionStorage.getItem(AUTO_OPEN_KEY) && lot) {
          sessionStorage.removeItem(AUTO_OPEN_KEY);
          const refreshed = await getLotByEmpreinte(fp.hash);
          setCurrentLot(refreshed || lot);
          setShowModal(true);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setCheckError('Impossible de vérifier votre éligibilité. Réessayez.');
        }
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (confettiCleanupRef.current) confettiCleanupRef.current();
      wheelSound.stop();
    };
  }, []);

  const openLotModal = (lot, newWin = false) => {
    setCurrentLot(lot);
    setIsNewWin(newWin);
    setShowModal(true);

    if (newWin) {
      if (confettiCleanupRef.current) confettiCleanupRef.current();
      confettiCleanupRef.current = launchConfetti();
    }
  };

  const handleSpin = async () => {
    if (isSpinning || hasLot || isChecking) return;

    setCheckError('');
    setIsChecking(true);

    try {
      const fp = fingerprint || (await generateFingerprint());
      setFingerprint(fp);

      const { allowed } = await canParticipate(fp.hash);

      if (!allowed) {
        const lot = await getLotByEmpreinte(fp.hash);
        setCurrentLot(lot);
        setHasLot(true);
        openLotModal(lot, false);
        setIsChecking(false);
        return;
      }

      wheelSound.init();

      const prizeIndex = Math.floor(Math.random() * prizes.length);
      const prize = prizes[prizeIndex];

      const extraRotations = 5 + Math.floor(Math.random() * 3);
      const targetRotation =
        extraRotations * 360 +
        (360 - prizeIndex * segmentAngle - segmentAngle / 2);

      setIsSpinning(true);
      setShowModal(false);
      setRotation((prev) => prev + targetRotation);
      wheelSound.startSpin(SPIN_DURATION_MS);

      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);

      spinTimeoutRef.current = setTimeout(async () => {
        try {
          const saved = await createLot({
            lot: prize,
            empreinteClient: fp.hash,
            businessName,
            fingerprintData: fp,
          });

          setHasLot(true);
          setIsSpinning(false);
          openLotModal(saved, true);
        } catch (err) {
          console.error(err);
          setCheckError("Erreur lors de l'enregistrement. Réessayez.");
          setIsSpinning(false);
        }
      }, SPIN_DURATION_MS);
    } catch (err) {
      console.error(err);
      setCheckError('Impossible de vérifier votre éligibilité. Réessayez.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleShowLot = async () => {
    if (currentLot) {
      const refreshed = await getLotByEmpreinte(
        fingerprint?.hash || currentLot.empreinteClient
      );
      if (refreshed) {
        openLotModal(refreshed, false);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (confettiCleanupRef.current) {
      confettiCleanupRef.current();
      confettiCleanupRef.current = null;
    }
  };

  const getButtonLabel = () => {
    if (isChecking) return 'Vérification...';
    if (isSpinning) return 'En cours...';
    if (hasLot) return 'Voir mon lot';
    return 'Tourner la roue';
  };

  const getStatusHint = () => {
    if (!hasLot || !currentLot) return null;
    const status = resolveLotStatus(currentLot);
    if (status === STATUT.EN_ATTENTE) return 'Lot réservé — QR code dans 24h';
    if (status === STATUT.ACTIF) return 'Votre QR code est disponible';
    if (status === STATUT.EXPIRE) return 'Lot expiré — rejouez dans 30 jours';
    if (status === STATUT.UTILISE) return 'Lot récupéré — rejouez dans 30 jours';
    return null;
  };

  return (
    <div className="fortune-wheel-page" style={themeStyle}>
      <div className="page-backdrop" aria-hidden="true" />
      <div className="fortune-wheel-container">
        <div className="main-card">
          <header className="fortune-wheel-header">
            <div className="logo-frame">
              <img src={logo} alt={`Logo ${businessName}`} className="merchant-logo" />
            </div>
            <p className="merchant-name">{businessName}</p>
            <h1>{welcomeText}</h1>
            <p className="header-subtitle">{subtitle}</p>
          </header>

          <div className="wheel-wrapper">
            <div className="wheel-pointer" aria-hidden="true">
              <div className="pointer-cap" />
              <div className="pointer-triangle" />
            </div>

            <div
              className={`wheel-spinner${isSpinning ? ' wheel-spinner--active' : ''}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`
                  : 'none',
              }}
            >
              <svg
                viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                className="wheel-svg"
                role="img"
                aria-label="Roue de la fortune"
              >
                <circle cx={CENTER} cy={CENTER} r={RADIUS + 10} className="wheel-glow-ring" />
                <circle cx={CENTER} cy={CENTER} r={RADIUS + 6} className="wheel-outer-ring" />

                {prizes.map((prize, index) => {
                  const startAngle = index * segmentAngle;
                  const endAngle = (index + 1) * segmentAngle;
                  const midAngle = startAngle + segmentAngle / 2;
                  const textPos = polarToCartesian(CENTER, CENTER, RADIUS * 0.62, midAngle);

                  return (
                    <g key={prize}>
                      <path
                        d={describeSegment(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                        fill={colors.segments[index % colors.segments.length]}
                        className="wheel-segment"
                      />
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        className="segment-label"
                        transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                      >
                        {prize}
                      </text>
                    </g>
                  );
                })}

                <circle cx={CENTER} cy={CENTER} r={28} className="wheel-center" />
                <circle cx={CENTER} cy={CENTER} r={12} className="wheel-center-dot" />
              </svg>
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className={`spin-button${hasLot && !isSpinning ? ' spin-button--secondary' : ''}`}
              onClick={hasLot ? handleShowLot : handleSpin}
              disabled={isChecking || isSpinning}
            >
              {getButtonLabel()}
            </button>

            {checkError && <p className="action-error">{checkError}</p>}

            {hasLot && !isSpinning && getStatusHint() && (
              <p className="already-played">{getStatusHint()}</p>
            )}

            {hasLot && currentLot && <DevTestButtons lot={currentLot} />}
          </div>
        </div>

        <footer className="agency-footer">
          <span>Propulsé par votre agence web</span>
        </footer>
      </div>

      {showModal && currentLot && (
        <ClientLotModal lot={currentLot} isNewWin={isNewWin} onClose={closeModal} />
      )}
    </div>
  );
}

export default FortuneWheel;
