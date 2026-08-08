import { nettoyerLibelle } from "./libelles";

const normaliser = (valeur = "") => nettoyerLibelle(String(valeur)).toLocaleLowerCase("fr-FR").trim();

// Les règles sont volontairement simples et lisibles : un mot ou un morceau de
// libellé, puis une catégorie et éventuellement une icône. Les plus récentes
// sont prioritaires afin qu'une correction de l'utilisateur gagne toujours.
export function appliquerReglesAuto(libelle, regles = [], categories = {}) {
  const source = normaliser(libelle);
  if (!source) return null;
  const regle = [...regles].reverse().find((r) => {
    const mot = normaliser(r.mot);
    return mot.length >= 2 && source.includes(mot) && categories[r.categorie];
  });
  if (!regle) return null;
  return { categorie: regle.categorie, icone: regle.icone || "", nom: regle.nom || regle.mot };
}
