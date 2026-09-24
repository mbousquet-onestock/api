// Vercel Serverless Function: proxy générique pour le Testeur d'API.
// Évite les blocages CORS en relayant l'appel côté serveur vers l'URL cible
// fournie par l'utilisateur depuis l'interface de test.
// On utilise node:http(s) plutôt que fetch : l'API OneStock attend des requêtes
// GET avec un corps JSON, ce que fetch refuse d'envoyer.

import http from 'node:http';
import https from 'node:https';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const TIMEOUT_MS = 25_000;

interface UpstreamResponse {
  status: number;
  statusText: string;
  contentType: string;
  body: string;
}

function sendRequest(url: URL, method: string, body: string): Promise<UpstreamResponse> {
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: TIMEOUT_MS
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode || 0,
            statusText: response.statusMessage || '',
            contentType: String(response.headers['content-type'] || ''),
            body: Buffer.concat(chunks).toString('utf8')
          })
        );
        response.on('error', reject);
      }
    );
    request.on('timeout', () => {
      const err = new Error('timeout');
      err.name = 'TimeoutError';
      request.destroy(err);
    });
    request.on('error', reject);
    request.end(body);
  });
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true;
  if (host === '169.254.169.254') return true; // métadonnées cloud
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée, utilisez POST.' });
    return;
  }

  const { targetUrl, payload, method: rawMethod } = req.body || {};
  const method = typeof rawMethod === 'string' ? rawMethod.toUpperCase() : 'POST';

  if (!ALLOWED_METHODS.includes(method)) {
    res.status(400).json({ error: `Méthode '${method}' non supportée.` });
    return;
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: "Le champ 'targetUrl' est requis." });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    res.status(400).json({ error: 'URL cible invalide.' });
    return;
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    res.status(400).json({ error: 'Seuls les protocoles http et https sont autorisés.' });
    return;
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    res.status(400).json({ error: 'Cette adresse cible n\'est pas autorisée.' });
    return;
  }

  const startedAt = Date.now();
  try {
    const upstream = await sendRequest(parsedUrl, method, JSON.stringify(payload ?? {}));

    const durationMs = Date.now() - startedAt;
    const contentType = upstream.contentType;
    const rawText = upstream.body;

    let data: unknown = rawText;
    if (contentType.includes('application/json')) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // On garde le texte brut si le parsing JSON échoue.
      }
    }

    res.status(200).json({
      ok: upstream.status >= 200 && upstream.status < 300,
      status: upstream.status,
      statusText: upstream.statusText,
      durationMs,
      data
    });
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    res.status(200).json({
      ok: false,
      status: 0,
      statusText: err?.name === 'TimeoutError' ? 'Délai dépassé' : 'Erreur réseau',
      durationMs,
      error: err?.name === 'TimeoutError'
        ? 'Le serveur cible n\'a pas répondu dans les 25 secondes.'
        : err?.message || 'Impossible de joindre le serveur cible.'
    });
  }
}
