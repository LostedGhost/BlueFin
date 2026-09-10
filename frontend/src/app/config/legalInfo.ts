// Informations légales de l'exploitant, lues depuis les variables d'environnement
// Vite (préfixe VITE_ obligatoire pour être exposées côté client — voir .env.example).
//
// Objectif : renseigner le RCCM/IFU/etc. réels ne doit être qu'une question de
// variables d'environnement, jamais une modification de code (voir plan-correction-totale.md).
// Tant qu'une variable n'est pas définie, le champ correspondant affiche "À compléter"
// plutôt qu'une valeur inventée — ne jamais remplacer ce comportement par une valeur
// en dur dans le code.

const NOT_SET = 'À compléter';

function envOrPlaceholder(value: string | undefined): string {
  const trimmed = (value || '').trim();
  return trimmed.length > 0 ? trimmed : NOT_SET;
}

export const CONTACT_INFO = {
  phone: envOrPlaceholder(import.meta.env.VITE_CONTACT_PHONE) !== NOT_SET
    ? import.meta.env.VITE_CONTACT_PHONE
    : '+229 01 23 45 67',
  email: envOrPlaceholder(import.meta.env.VITE_CONTACT_EMAIL) !== NOT_SET
    ? import.meta.env.VITE_CONTACT_EMAIL
    : 'contact@bluefin-immo.com',
};

export const LEGAL_INFO = {
  entityName: envOrPlaceholder(import.meta.env.VITE_LEGAL_ENTITY_NAME) !== NOT_SET
    ? import.meta.env.VITE_LEGAL_ENTITY_NAME
    : 'Bluefin Immo',
  formeJuridique: envOrPlaceholder(import.meta.env.VITE_LEGAL_FORME_JURIDIQUE),
  siegeSocial: envOrPlaceholder(import.meta.env.VITE_LEGAL_SIEGE_SOCIAL) !== NOT_SET
    ? import.meta.env.VITE_LEGAL_SIEGE_SOCIAL
    : 'Cotonou, République du Bénin (adresse complète à compléter)',
  rccm: envOrPlaceholder(import.meta.env.VITE_LEGAL_RCCM),
  capitalSocial: envOrPlaceholder(import.meta.env.VITE_LEGAL_CAPITAL_SOCIAL),
  ifu: envOrPlaceholder(import.meta.env.VITE_LEGAL_IFU),
  directeurPublication: envOrPlaceholder(import.meta.env.VITE_LEGAL_DIRECTEUR_PUBLICATION),
  hebergeur: envOrPlaceholder(import.meta.env.VITE_LEGAL_HEBERGEUR) !== NOT_SET
    ? import.meta.env.VITE_LEGAL_HEBERGEUR
    : 'Hostinger',
  telephone: CONTACT_INFO.phone,
  email: CONTACT_INFO.email,
};

export const LEGAL_PLACEHOLDER = NOT_SET;
