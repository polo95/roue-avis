/**
 * Configuration du commerçant — modifier ce fichier pour chaque client.
 *
 * Logo : placer l'image dans le dossier public/ (ex: public/logo-commercant.png)
 *        puis mettre à jour le chemin ci-dessous.
 */

const businessName = 'Café du Centre';

const config = {
  businessName,

  // Chemin vers le logo (dossier public/)
  logo: '/logo-commercant.svg',

  // Utilisez {businessName} pour insérer automatiquement le nom du commerce
  welcomeMessage: 'Tentez votre chance chez {businessName}',

  // Sous-titre affiché sous le message de bienvenue
  subtitle: 'Tournez la roue et découvrez votre lot',

  // Lien vers la page Google Avis du commerçant
  googleReviewUrl: 'https://lien-google-avis.com',

  // URL de base pour les QR codes (changer en production)
  appBaseUrl: 'http://localhost:3000',

  // Mot de passe du tableau de bord commerçant (/dashboard)
  dashboardPassword: 'norddigital2024',

  // Message affiché dans la popup pour récupérer le lot
  cashierMessage:
    'Montrez cet écran au commerçant avec votre reçu d\'achat de plus de 5€',

  // Lots affichés sur la roue (un lot par segment)
  prizes: [
    '10% de réduction',
    'Café offert',
    'Livraison gratuite',
    '15% de réduction',
    'Dessert offert',
    '20% de réduction',
  ],

  colors: {
    // Couleurs des segments de la roue (une par lot)
    segments: [
      '#FF6B6B',
      '#4ECDC4',
      '#FFE66D',
      '#A66CFF',
      '#FF8C42',
      '#45B7D1',
    ],

    // Fond de la page (dégradé)
    background: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#0f172a',
    },

    // Couleurs d'accent (bouton, lot gagné, etc.)
    accent: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
    },

    // Dégradé du titre principal
    titleGradient: ['#818cf8', '#a78bfa', '#c084fc'],

    // Éléments de la roue
    pointer: '#ffffff',
    segmentBorder: '#ffffff',
    segmentText: '#1a1a2e',
    wheelRing: '#ffffff',
    wheelCenter: '#ffffff',
    wheelCenterBorder: '#1a1a2e',
    wheelCenterDot: '#ff6b6b',
  },
};

export function formatMessage(message, name = businessName) {
  return message.replace(/\{businessName\}/g, name);
}

export default config;
