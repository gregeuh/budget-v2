/**
 * Carnet de lieux personnalisés.
 *
 * Permet de donner un nom parlant à une adresse réelle :
 *   « 86 Quai des Chartrons » → « Coiffeur »
 *
 * On mémorise le nom choisi avec les coordonnées. Quand une nouvelle opération
 * tombe au même endroit (à quelques mètres près), on repropose ce nom.
 *
 * Stocké dans le profil (profil.lieuxPerso), donc synchronisé comme le reste.
 * Format : [{ nom, lat, lon, adresse }]
 */

// Distance approximative en mètres entre deux points (suffisant à l'échelle d'un quartier).
function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Cherche un lieu personnalisé proche des coordonnées données (≤ 40 m). */
export function lieuPersoProche(lieuxPerso = [], lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let meilleur = null;
  let min = 40; // rayon de reconnaissance, en mètres
  for (const l of lieuxPerso) {
    if (!Number.isFinite(l.lat) || !Number.isFinite(l.lon)) continue;
    const d = distanceM(lat, lon, l.lat, l.lon);
    if (d <= min) {
      min = d;
      meilleur = l;
    }
  }
  return meilleur;
}

/**
 * Ajoute ou met à jour un lieu renommé.
 * Si un lieu perso existe déjà tout près, on le remplace (nouveau nom).
 */
export function enregistrerLieuPerso(lieuxPerso = [], { nom, lat, lon, adresse = "" }) {
  if (!nom || !Number.isFinite(lat) || !Number.isFinite(lon)) return lieuxPerso;
  const proche = lieuPersoProche(lieuxPerso, lat, lon);
  const sansProche = proche ? lieuxPerso.filter((l) => l !== proche) : lieuxPerso;
  return [{ nom: nom.slice(0, 60), lat, lon, adresse: adresse.slice(0, 90) }, ...sansProche].slice(0, 100);
}

/** Retire un lieu personnalisé par son nom. */
export function supprimerLieuPerso(lieuxPerso = [], nom) {
  return lieuxPerso.filter((l) => l.nom !== nom);
}
