/**
 * Recherche de lieux réels via Nominatim (OpenStreetMap).
 *
 * Gratuit, sans clé API. Confirme qu'un lieu existe vraiment et fournit
 * son adresse et ses coordonnées (pour l'afficher ensuite sur une carte).
 *
 * Politique d'usage OSM : usage léger, 1 requête/seconde max. C'est pourquoi
 * le composant appelant attend que tu aies fini de taper (anti-rebond) et
 * n'interroge qu'à partir de 3 caractères.
 *
 * Dégradation gracieuse : si le service est injoignable, la recherche renvoie
 * simplement une liste vide et le champ reste utilisable en texte libre.
 */

const BASE = "https://nominatim.openstreetmap.org/search";

// Met en forme un résultat OSM en quelque chose de court et lisible.
function formater(item) {
  const a = item.address || {};
  // Nom principal : le commerce/lieu si connu, sinon la rue
  const nom =
    a.shop || a.amenity || a.leisure || a.tourism || a.building ||
    item.namedetails?.name || a.road || item.name || (item.display_name || "").split(",")[0];

  // Contexte court : ville + code postal, pour distinguer deux lieux homonymes
  const ville = a.city || a.town || a.village || a.municipality || "";
  const contexte = [a.road && a.road !== nom ? a.road : null, ville, a.postcode]
    .filter(Boolean)
    .join(", ");

  return {
    nom: (nom || "Lieu").slice(0, 60),
    adresse: contexte.slice(0, 90),
    complet: (item.display_name || "").slice(0, 160),
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  };
}

/**
 * Cherche des lieux correspondant à `requete`.
 * `pres` (optionnel) = { lat, lon } pour privilégier les résultats proches.
 * Renvoie [] en cas d'échec plutôt que de lever une erreur.
 */
export async function chercherLieux(requete, { pres, signal } = {}) {
  const q = (requete || "").trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    namedetails: "1",
    limit: "5",
    "accept-language": "fr",
    countrycodes: "fr",
  });

  // Biais géographique : une fenêtre autour de la position connue, si fournie
  if (pres && Number.isFinite(pres.lat) && Number.isFinite(pres.lon)) {
    const d = 0.4; // ~40 km
    params.set("viewbox", `${pres.lon - d},${pres.lat + d},${pres.lon + d},${pres.lat - d}`);
    params.set("bounded", "0");
  }

  try {
    const r = await fetch(`${BASE}?${params.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (Array.isArray(data) ? data : [])
      .map(formater)
      .filter((x) => x.nom && Number.isFinite(x.lat));
  } catch {
    return [];
  }
}

/** URL d'une mini-carte OpenStreetMap embarquable (iframe), gratuite. */
export function urlCarteEmbed(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const d = 0.004;
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/**
 * Lien vers la carte en grand.
 * Sur iPhone/iPad, "maps://" ouvre directement l'app Plans (pas le navigateur).
 * Le format d'Apple accepte des coordonnées (ll) et/ou une requête texte (q).
 */
export function lienCarte(lat, lon, nom = "") {
  const q = nom ? `&q=${encodeURIComponent(nom)}` : "";
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    // ll = point exact ; q = libellé affiché sur l'épingle
    return `https://maps.apple.com/?ll=${lat},${lon}${nom ? q : "&q=" + lat + "," + lon}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(nom)}`;
}
