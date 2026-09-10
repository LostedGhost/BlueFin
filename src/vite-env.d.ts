/// <reference types="vite/client" />

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';
declare module '*.styl';

interface ImportMetaEnv {
  readonly VITE_CONTACT_PHONE?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_LEGAL_ENTITY_NAME?: string;
  readonly VITE_LEGAL_FORME_JURIDIQUE?: string;
  readonly VITE_LEGAL_SIEGE_SOCIAL?: string;
  readonly VITE_LEGAL_RCCM?: string;
  readonly VITE_LEGAL_CAPITAL_SOCIAL?: string;
  readonly VITE_LEGAL_IFU?: string;
  readonly VITE_LEGAL_DIRECTEUR_PUBLICATION?: string;
  readonly VITE_LEGAL_HEBERGEUR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}