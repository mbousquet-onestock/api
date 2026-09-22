export interface ApiTesterConfig {
  baseUrl: string;
  siteId: string;
  token: string;
}

const STORAGE_KEY = 'api_tester_config_v1';

const DEFAULT_CONFIG: ApiTesterConfig = {
  baseUrl: '',
  siteId: '',
  token: ''
};

export function loadApiTesterConfig(): ApiTesterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    console.error('Erreur lecture configuration API Tester:', err);
    return { ...DEFAULT_CONFIG };
  }
}

export function saveApiTesterConfig(config: ApiTesterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Erreur sauvegarde configuration API Tester:', err);
  }
}
