// Vercel Serverless Function: proxy générique pour le Testeur d'API.
// Évite les blocages CORS en relayant l'appel côté serveur vers l'URL cible
// fournie par l'utilisateur depuis l'interface de test.

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

  const { targetUrl, payload } = req.body || {};

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
    const upstreamResponse = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
      signal: AbortSignal.timeout(25_000)
    });

    const durationMs = Date.now() - startedAt;
    const contentType = upstreamResponse.headers.get('content-type') || '';
    const rawText = await upstreamResponse.text();

    let data: unknown = rawText;
    if (contentType.includes('application/json')) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // On garde le texte brut si le parsing JSON échoue.
      }
    }

    res.status(200).json({
      ok: upstreamResponse.ok,
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
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
