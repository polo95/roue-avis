import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const LOTS_COLLECTION = 'lots';
const EMPREINTES_COLLECTION = 'empreintes';

const ACTIVATION_HOURS = 24;
const VALIDITY_HOURS = 72;
const COOLDOWN_DAYS = 30;

export const STATUT = {
  EN_ATTENTE: 'en_attente',
  ACTIF: 'actif',
  UTILISE: 'utilise',
  EXPIRE: 'expire',
};

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

export function getCooldownEndDate(lot) {
  const dateGain = toDate(lot?.dateGain);
  if (!dateGain) return null;
  return new Date(dateGain.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

export function getDaysUntilReplay(lot, now = new Date()) {
  const cooldownEnd = getCooldownEndDate(lot);
  if (!cooldownEnd) return 0;
  const ms = cooldownEnd.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isFingerprintLocked(lot, now = new Date()) {
  if (!lot) return false;
  const cooldownEnd = getCooldownEndDate(lot);
  return cooldownEnd ? cooldownEnd.getTime() > now.getTime() : false;
}

export function resolveLotStatus(lot, now = new Date()) {
  if (!lot) return null;
  if (lot.statut === STATUT.UTILISE) return STATUT.UTILISE;

  const dateActivation = toDate(lot.dateActivation);
  const dateExpiration = toDate(lot.dateExpiration);

  if (now.getTime() > dateExpiration.getTime()) {
    return STATUT.EXPIRE;
  }

  if (now.getTime() >= dateActivation.getTime()) {
    return STATUT.ACTIF;
  }

  return STATUT.EN_ATTENTE;
}

export async function syncLotStatus(lot) {
  const resolved = resolveLotStatus(lot);
  if (!resolved || resolved === lot.statut) {
    return { ...lot, statut: resolved || lot.statut };
  }

  if (resolved === STATUT.ACTIF || resolved === STATUT.EXPIRE) {
    const docRef = doc(db, LOTS_COLLECTION, lot.id);
    await updateDoc(docRef, { statut: resolved });
    return { ...lot, statut: resolved };
  }

  return { ...lot, statut: resolved };
}

export async function getLotById(lotId) {
  const snapshot = await getDoc(doc(db, LOTS_COLLECTION, lotId));
  if (!snapshot.exists()) return null;
  const lot = { id: snapshot.id, ...snapshot.data() };
  return syncLotStatus(lot);
}

export async function getLotByEmpreinte(empreinteHash) {
  const empreinteRef = doc(db, EMPREINTES_COLLECTION, empreinteHash);
  const empreinteSnap = await getDoc(empreinteRef);

  if (!empreinteSnap.exists()) {
    return null;
  }

  const { lotId } = empreinteSnap.data();
  return getLotById(lotId);
}

export async function canParticipate(empreinteHash) {
  const lot = await getLotByEmpreinte(empreinteHash);

  if (!lot) {
    return { allowed: true, lot: null };
  }

  if (isFingerprintLocked(lot)) {
    return { allowed: false, lot };
  }

  return { allowed: true, lot: null };
}

export async function createLot({ lot: prizeName, empreinteClient, businessName, fingerprintData }) {
  const id = uuidv4();
  const now = new Date();
  const dateActivation = new Date(now.getTime() + ACTIVATION_HOURS * 60 * 60 * 1000);
  const dateExpiration = new Date(
    dateActivation.getTime() + VALIDITY_HOURS * 60 * 60 * 1000
  );

  const payload = {
    id,
    lot: prizeName,
    dateGain: Timestamp.fromDate(now),
    dateActivation: Timestamp.fromDate(dateActivation),
    dateExpiration: Timestamp.fromDate(dateExpiration),
    statut: STATUT.EN_ATTENTE,
    empreinteClient,
    businessName,
    ip: fingerprintData?.ip || null,
    browser: fingerprintData?.browser || null,
    screenInfo: fingerprintData?.screenInfo || null,
  };

  await setDoc(doc(db, LOTS_COLLECTION, id), payload);
  await setDoc(doc(db, EMPREINTES_COLLECTION, empreinteClient), {
    lotId: id,
    dateGain: Timestamp.fromDate(now),
  });

  return {
    ...payload,
    dateGain: now,
    dateActivation,
    dateExpiration,
  };
}

export async function markLotAsUsed(lotId) {
  const docRef = doc(db, LOTS_COLLECTION, lotId);
  await updateDoc(docRef, { statut: STATUT.UTILISE });
}

export async function simulate24hActivation(lotId) {
  const now = new Date();
  const dateActivation = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  await updateDoc(doc(db, LOTS_COLLECTION, lotId), {
    dateActivation: Timestamp.fromDate(dateActivation),
    statut: STATUT.ACTIF,
  });
}

export async function simulate72hExpiration(lotId) {
  const now = new Date();
  const dateExpiration = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  await updateDoc(doc(db, LOTS_COLLECTION, lotId), {
    dateExpiration: Timestamp.fromDate(dateExpiration),
    statut: STATUT.EXPIRE,
  });
}

export async function getAllLots() {
  const lotsQuery = query(collection(db, LOTS_COLLECTION), orderBy('dateGain', 'desc'));
  const snapshot = await getDocs(lotsQuery);

  const lots = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return Promise.all(lots.map((lot) => syncLotStatus(lot)));
}

export function getValidateUrl(lotId, baseUrl) {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/validate/${lotId}`;
}

export function getDashboardStats(lots) {
  const stats = {
    enAttente: 0,
    actifs: 0,
    valides: 0,
    expires: 0,
    total: lots.length,
  };

  lots.forEach((lot) => {
    const status = resolveLotStatus(lot);
    if (status === STATUT.EN_ATTENTE) stats.enAttente += 1;
    else if (status === STATUT.ACTIF) stats.actifs += 1;
    else if (status === STATUT.UTILISE) stats.valides += 1;
    else if (status === STATUT.EXPIRE) stats.expires += 1;
  });

  return stats;
}

export function filterLots(lots, { statusFilter, dateFrom, dateTo }) {
  return lots.filter((lot) => {
    const status = resolveLotStatus(lot);
    if (statusFilter && statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }

    if (dateFrom || dateTo) {
      const dateGain = toDate(lot.dateGain);
      if (dateFrom && dateGain < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && dateGain > new Date(`${dateTo}T23:59:59`)) return false;
    }

    return true;
  });
}

export function getStatusLabel(statut) {
  const labels = {
    [STATUT.EN_ATTENTE]: 'En attente',
    [STATUT.ACTIF]: 'Actif',
    [STATUT.UTILISE]: 'Validé ✓',
    [STATUT.EXPIRE]: 'Expiré',
  };
  return labels[statut] || statut;
}

export function formatFrenchDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getHoursUntilActivation(lot, now = new Date()) {
  const dateActivation = toDate(lot?.dateActivation);
  if (!dateActivation) return 0;
  const ms = dateActivation.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (60 * 60 * 1000));
}
