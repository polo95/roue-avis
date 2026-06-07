import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';
import {
  getAllLots,
  getDashboardStats,
  filterLots,
  resolveLotStatus,
  getStatusLabel,
  formatFrenchDate,
  getValidateUrl,
  STATUT,
} from '../services/participationService';
import QrScannerModal from '../components/QrScannerModal';
import './Dashboard.css';

const AUTH_KEY = 'roue-avis-dashboard-auth';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: STATUT.EN_ATTENTE, label: 'En attente' },
  { value: STATUT.ACTIF, label: 'Actifs' },
  { value: STATUT.UTILISE, label: 'Validés' },
  { value: STATUT.EXPIRE, label: 'Expirés' },
];

function getStatusClass(statut) {
  return `status-badge status-badge--${statut}`;
}

function formatShortId(id) {
  if (!id) return '—';
  return id.slice(0, 8);
}

function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === 'true'
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const loadLots = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAllLots();
      setLots(data);
    } catch (err) {
      setError('Impossible de charger les lots. Vérifiez Firebase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLots();
    }
  }, [isAuthenticated, loadLots]);

  const handleLogin = (event) => {
    event.preventDefault();

    if (password === config.dashboardPassword) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setLoginError('');
      return;
    }

    setLoginError('Mot de passe incorrect');
  };

  const filteredLots = useMemo(
    () => filterLots(lots, { statusFilter, dateFrom, dateTo }),
    [lots, statusFilter, dateFrom, dateTo]
  );

  const stats = getDashboardStats(lots);

  if (!isAuthenticated) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-login-card">
          <h1>Tableau de bord</h1>
          <p>Accès réservé au commerçant</p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
            />
            {loginError && <p className="dashboard-error">{loginError}</p>}
            <button type="submit">Se connecter</button>
          </form>

          <Link to="/" className="dashboard-back-link">
            ← Retour à la roue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Tableau de bord — {config.businessName}</h1>
            <p>Suivi des lots et validations QR code</p>
          </div>
          <Link to="/" className="dashboard-back-link">
            ← Retour à la roue
          </Link>
        </header>

        <button
          type="button"
          className="dashboard-scan-button"
          onClick={() => setShowScanner(true)}
        >
          <span className="dashboard-scan-icon" aria-hidden="true">📷</span>
          Scanner un QR code
        </button>

        {showScanner && <QrScannerModal onClose={() => setShowScanner(false)} />}

        <section className="dashboard-stats dashboard-stats--four">
          <div className="stat-card stat-card--pending">
            <span className="stat-value">{stats.enAttente}</span>
            <span className="stat-label">En attente</span>
          </div>
          <div className="stat-card stat-card--active">
            <span className="stat-value">{stats.actifs}</span>
            <span className="stat-label">Actifs</span>
          </div>
          <div className="stat-card stat-card--validated">
            <span className="stat-value">{stats.valides}</span>
            <span className="stat-label">Validés</span>
          </div>
          <div className="stat-card stat-card--expired">
            <span className="stat-value">{stats.expires}</span>
            <span className="stat-label">Expirés</span>
          </div>
        </section>

        {error && <p className="dashboard-error dashboard-error--banner">{error}</p>}

        <section className="dashboard-filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Statut</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="date-from">Du</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="date-to">Au</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="dashboard-refresh"
            onClick={loadLots}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </section>

        <section className="dashboard-table-section">
          <div className="dashboard-table-header">
            <h2>
              Lots ({filteredLots.length} / {stats.total})
            </h2>
          </div>

          {loading && lots.length === 0 ? (
            <p className="dashboard-empty">Chargement des lots...</p>
          ) : filteredLots.length === 0 ? (
            <p className="dashboard-empty">Aucun lot trouvé.</p>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date gain</th>
                    <th>Lot</th>
                    <th>Activation</th>
                    <th>Expiration</th>
                    <th>Statut</th>
                    <th>QR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.map((item) => {
                    const status = resolveLotStatus(item);
                    return (
                      <tr key={item.id} className={`row--${status}`}>
                        <td>
                          <span className="lot-id-badge" title={item.id}>
                            [ {formatShortId(item.id)} ]
                          </span>
                        </td>
                        <td>{formatFrenchDate(item.dateGain)}</td>
                        <td className="dashboard-prize">{item.lot}</td>
                        <td>{formatFrenchDate(item.dateActivation)}</td>
                        <td>{formatFrenchDate(item.dateExpiration)}</td>
                        <td>
                          <span className={getStatusClass(status)}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td>
                          <a
                            href={getValidateUrl(item.id, config.appBaseUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="qr-link"
                          >
                            Voir
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
