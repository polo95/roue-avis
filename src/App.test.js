import { render, screen } from '@testing-library/react';
import App from './App';
import config from './config';

jest.mock('./firebase', () => ({
  __esModule: true,
  default: {},
  db: {},
}));

jest.mock('./utils/fingerprint', () => ({
  generateFingerprint: jest.fn(() =>
    Promise.resolve({
      hash: 'test-fingerprint',
      ip: '127.0.0.1',
      browser: 'test',
      screenInfo: '1920x1080x24',
    })
  ),
}));

jest.mock('./services/participationService', () => ({
  STATUT: {
    EN_ATTENTE: 'en_attente',
    ACTIF: 'actif',
    UTILISE: 'utilise',
    EXPIRE: 'expire',
  },
  canParticipate: jest.fn(() => Promise.resolve({ allowed: true, lot: null })),
  createLot: jest.fn(),
  getLotByEmpreinte: jest.fn(() => Promise.resolve(null)),
  getLotById: jest.fn(() => Promise.resolve(null)),
  isFingerprintLocked: jest.fn(() => false),
  resolveLotStatus: jest.fn(),
  getAllLots: jest.fn(() => Promise.resolve([])),
  markLotAsUsed: jest.fn(),
  getDashboardStats: jest.fn(() => ({
    enAttente: 0,
    actifs: 0,
    valides: 0,
    expires: 0,
    total: 0,
  })),
  filterLots: jest.fn(() => []),
  getStatusLabel: jest.fn(),
  formatFrenchDate: jest.fn(),
  getValidateUrl: jest.fn(),
}));

test('affiche le nom du commerce et le bouton de jeu', async () => {
  render(<App />);

  expect(await screen.findByText(config.businessName)).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /tourner la roue/i })).toBeInTheDocument();
});
