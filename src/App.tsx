import React, { useEffect, useState } from 'react';
import {
  Plug,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Send,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Info,
  Clock,
  Trash2
} from 'lucide-react';
import { ApiTesterConfig, loadApiTesterConfig, saveApiTesterConfig } from './utils/apiTesterConfig';

const ENDPOINT_PATH = '/v3/reserved_stocks';

interface CallResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  data?: unknown;
  error?: string;
}

interface HistoryEntry extends CallResult {
  id: number;
  time: string;
  targetUrl: string;
}

export default function App() {
  const [config, setConfig] = useState<ApiTesterConfig>(() => loadApiTesterConfig());
  const [showToken, setShowToken] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const [orderIdsText, setOrderIdsText] = useState('AUS-001');
  const [global, setGlobal] = useState(false);
  const [limit, setLimit] = useState(100);
  const [start, setStart] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    saveApiTesterConfig(config);
  }, [config]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiTesterConfig(config);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const orderIds = orderIdsText
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const payload = {
    site_id: config.siteId,
    token: config.token,
    filter: {
      global,
      order_ids: orderIds
    },
    pagination: {
      limit,
      start
    }
  };

  const targetUrl = `${config.baseUrl.replace(/\/+$/, '')}${ENDPOINT_PATH}`;
  const isConfigComplete = Boolean(config.baseUrl && config.siteId && config.token);

  const handleSend = async () => {
    if (!isConfigComplete || loading) return;
    setLoading(true);
    setResult(null);

    const startedAt = Date.now();
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, payload })
      });

      if (!res.ok) {
        throw new Error(`Le proxy a répondu ${res.status}`);
      }

      const json: CallResult = await res.json();
      setResult(json);
      setHistory((prev) => [
        { ...json, id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), targetUrl },
        ...prev
      ].slice(0, 10));
    } catch (err: any) {
      const failed: CallResult = {
        ok: false,
        status: 0,
        statusText: 'Erreur',
        durationMs: Date.now() - startedAt,
        error: err?.message || 'Requête impossible à envoyer.'
      };
      setResult(failed);
      setHistory((prev) => [
        { ...failed, id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), targetUrl },
        ...prev
      ].slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const text = JSON.stringify(result.data ?? result.error ?? '', null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const statusBadge = (r: CallResult) => {
    if (r.status === 0) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (r.status >= 200 && r.status < 300) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (r.status >= 400 && r.status < 500) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Plug className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Testeur d'API</h1>
            <p className="text-xs text-slate-500 leading-tight">Stocks réservés — POST {ENDPOINT_PATH}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Info banner about the proxy */}
        <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            L'appel passe par une fonction serverless Vercel (<span className="font-mono">/api/proxy</span>) afin d'éviter les blocages CORS.
            Cette route fonctionne une fois l'application déployée sur Vercel (ou en local via <span className="font-mono">vercel dev</span>) — elle n'est pas disponible avec <span className="font-mono">npm run dev</span>.
          </p>
        </div>

        {/* Configuration */}
        <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Configuration de connexion</h2>
            {configSaved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configuration enregistrée</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">URL de base *</label>
              <input
                type="url"
                required
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://votre-solution.vercel.app"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                L'appel sera envoyé à <span className="font-mono">{config.baseUrl || '{{url}}'}{ENDPOINT_PATH}</span>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Site ID *</label>
              <input
                type="text"
                required
                value={config.siteId}
                onChange={(e) => setConfig({ ...config, siteId: e.target.value })}
                placeholder="ex: 1234"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Token *</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="Token d'authentification"
                  className="w-full p-2.5 pr-9 border border-slate-200 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showToken ? 'Masquer le token' : 'Afficher le token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer la configuration</span>
            </button>
          </div>
        </form>

        {/* Request builder + Result: two columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request builder */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900">Paramètres de la requête</h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Order IDs (un par ligne ou séparés par une virgule)
              </label>
              <textarea
                rows={3}
                value={orderIdsText}
                onChange={(e) => setOrderIdsText(e.target.value)}
                placeholder="AUS-001"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="filter-global"
                type="checkbox"
                checked={global}
                onChange={(e) => setGlobal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="filter-global" className="font-semibold text-slate-700">
                filter.global
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Limit</label>
                <input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start</label>
                <input
                  type="number"
                  min={0}
                  value={start}
                  onChange={(e) => setStart(Number(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Aperçu du corps envoyé</label>
              <pre className="w-full max-h-56 overflow-auto p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono leading-relaxed">
{JSON.stringify(payload, null, 2)}
              </pre>
            </div>

            {!isConfigComplete && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Complétez et enregistrez l'URL, le Site ID et le token avant d'envoyer la requête.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!isConfigComplete || loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Envoi en cours...' : 'Envoyer la requête'}</span>
            </button>
          </div>

          {/* Result */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Résultat</h2>
              {result && !result.error && (
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié' : 'Copier'}</span>
                </button>
              )}
            </div>

            {!result && (
              <p className="text-slate-500 text-[11px]">Aucune requête envoyée pour le moment.</p>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-bold border ${statusBadge(result)}`}>
                    {result.status || 'ERR'} {result.statusText}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {result.durationMs} ms
                  </span>
                </div>

                {result.error && (
                  <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{result.error}</span>
                  </div>
                )}

                {!result.error && (
                  <pre className="w-full max-h-96 overflow-auto p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono leading-relaxed">
{JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Historique des appels (session)</h2>
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 text-[11px] font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            </div>
            <ul className="divide-y divide-slate-100">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setResult(entry)}
                    className="w-full flex items-center justify-between gap-3 py-2 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge(entry)}`}>
                        {entry.status || 'ERR'}
                      </span>
                      <span className="truncate text-slate-600 font-mono text-[11px]">{entry.targetUrl}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{entry.time} · {entry.durationMs} ms</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
