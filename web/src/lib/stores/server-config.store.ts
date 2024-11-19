import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto & { loaded: boolean };

export const featureFlags = writable<FeatureFlags>({
  loaded: false,
  smartSearch: true,
  duplicateDetection: false,
  facialRecognition: true,
  importFaces: false,
  sidecar: true,
  map: true,
  reverseGeocoding: true,
  search: true,
  oauth: false,
  oauthAutoLaunch: false,
  passwordLogin: true,
  configFile: false,
  trash: true,
  email: false,
});

export type ServerConfig = ServerConfigDto & { loaded: boolean };

export const serverConfig = writable<ServerConfig>({
  loaded: false,
  oauthButtonText: '',
  loginPageMessage: '',
  trashDays: 30,
  userDeleteDelay: 7,
  isInitialized: false,
  isOnboarded: false,
  externalDomain: '',
  mapDarkStyleUrl: '',
  mapLightStyleUrl: '',
});

export const retrieveServerConfig = async () => {
  featureFlags.update(() => ({ loaded: true }));
  serverConfig.update(() => ({ loaded: true }));
};
