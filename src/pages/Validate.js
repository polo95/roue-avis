import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getLotById,
  markLotAsUsed,
  resolveLotStatus,
  STATUT,
  formatFrenchDate,
} from '../services/participationService';
import {
  isValidateAuthenticated,
  setValidateAuthenticated,
  checkMerchantPassword,
} from '../utils/merchantAuth';
import './Validate.css';

function buildStatusConfig(lot) {
  return {
    [STATUT.EN_ATTENTE]: {
      className: 'validate-page--pending',
      title: 'QR code pas encore actif',
      message: `Ce lot sera disponible le ${formatFrenchDate(lot.dateActivation)}`,
    },
    [STATUT.ACTIF]: {
      className: 'validate-page--active',
      title: 'Lot à remettre',
      message: 'Vérifiez le reçu du client avant validation',
    },
    [STATUT.UTILISE]: {
      className: 'validate-page--used',
      title: 'Ce lot a déjà été utilisé - Fraude',
      message: 'Ce QR code a déjà été scanné et validé',
    },
    [STATUT.EXPIRE]: {
      className: 'validate-page--expired',
      title: 'Ce lot a expiré',
      message: `Date limite dépassée : ${formatFrenchDate(lot.dateExpiration)}`,
    },
  };
}

function ValidateErrorPage({ title, message, errorDetail }) {
  return (
    <div className="validate-page validate-page--used">
      <div className="validate-card">
        <h1>{title}</h1>
        <p className="validate-message">{message}</p>
        {errorDetail && <p className="validate-error">{errorDetail}</p>}
        <Link to="/" className="validate-link">
          Retour à la roue
        </Link>
      </div>
    </div>
  );
}

function ValidateSuccessPage({ prizeName }) {
  return (
    <div className="validate-page validate-page--success">
      <div className="validate-card validate-card--success">
        <div className="validate-success-check" aria-hidden="true">
          ✓
        </div>
        <h1>Lot remis avec succès !</h1>
        <div className="validate-prize validate-prize--success">{prizeName}</div>
        <p className="validate-message">Le client peut récupérer sa récompense</p>
        <Link to="/dashboard" className="validate-button validate-button--success">
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

function Validate() {
  const { id } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(isValidateAuthenticated);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lot, setLot] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(() => isValidateAuthenticated());
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [justValidated, setJustValidated] = useState(false);
  const [validatedPrize, setValidatedPrize] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      setError('');
      setLoadFailed(false);
      setLot(null);
      setStatus(null);
      setJustValidated(false);

      try {
        const data = await getLotById(id);

        if (!data) {
          console.log('[Validate] Lot introuvable pour ID:', id);
          setLoadFailed(true);
          setError('QR code invalide');
          return;
        }

        const resolvedStatus = resolveLotStatus(data);
        console.log('[Validate] Lot chargé:', { id: data.id, statut: resolvedStatus });
        setLot(data);
        setStatus(resolvedStatus);
      } catch (err) {
        console.log('[Validate] Erreur Firebase:', err);
        console.error(err);
        setLoadFailed(true);
        setError(
          err?.message || 'Erreur de connexion Firebase. Vérifiez votre réseau.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated]);

  const handleLogin = (event) => {
    event.preventDefault();
    setLoginError('');

    if (checkMerchantPassword(password)) {
      setValidateAuthenticated();
      setIsAuthenticated(true);
      setLoading(true);
      return;
    }

    setLoginError('Accès réservé au commerçant');
  };

  const handleValidate = async () => {
    setValidating(true);
    setError('');

    try {
      await markLotAsUsed(id);
      setValidatedPrize(lot.lot);
      setJustValidated(true);
    } catch (err) {
      console.log('[Validate] Erreur validation:', err);
      console.error(err);
      setError('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="validate-page validate-page--auth">
        <div className="validate-card validate-card--auth">
          <p className="validate-commerce">Espace commerçant</p>
          <h1>Validation de lot</h1>
          <p className="validate-message">
            Entrez le mot de passe commerçant pour accéder à cette page
          </p>

          <form className="validate-auth-form" onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe commerçant"
              autoComplete="current-password"
              autoFocus
            />
            {loginError && <p className="validate-error">{loginError}</p>}
            <button type="submit" className="validate-button">
              Accéder
            </button>
          </form>

          <Link to="/" className="validate-link">
            Retour à la roue
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="validate-page validate-page--loading">
        <p>Chargement...</p>
      </div>
    );
  }

  if (loadFailed || !lot) {
    const isInvalidQr = error === 'QR code invalide';
    return (
      <ValidateErrorPage
        title={isInvalidQr ? 'QR code invalide' : 'Erreur'}
        message={
          isInvalidQr
            ? 'Ce QR code ne correspond à aucun lot enregistré.'
            : 'Impossible de charger les informations du lot.'
        }
        errorDetail={!isInvalidQr ? error : undefined}
      />
    );
  }

  if (justValidated) {
    return <ValidateSuccessPage prizeName={validatedPrize || lot.lot} />;
  }

  const statusConfig = buildStatusConfig(lot);
  const pageConfig = statusConfig[status] || statusConfig[STATUT.EXPIRE];

  return (
    <div className={`validate-page ${pageConfig.className}`}>
      <div className="validate-card">
        <p className="validate-commerce">{lot.businessName || 'Commerçant'}</p>
        <h1>{pageConfig.title}</h1>
        <p className="validate-message">{pageConfig.message}</p>

        {status === STATUT.ACTIF && (
          <>
            <div className="validate-prize">{lot.lot}</div>
            <button
              type="button"
              className="validate-button"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? 'Validation...' : 'Valider et remettre le lot'}
            </button>
          </>
        )}

        {(status === STATUT.UTILISE || status === STATUT.EXPIRE) && (
          <div className="validate-prize validate-prize--muted">{lot.lot}</div>
        )}

        {status === STATUT.EN_ATTENTE && (
          <div className="validate-prize validate-prize--muted">{lot.lot}</div>
        )}

        {error && <p className="validate-error">{error}</p>}

        <Link to="/dashboard" className="validate-link">
          Tableau de bord commerçant
        </Link>
      </div>
    </div>
  );
}

export default Validate;
