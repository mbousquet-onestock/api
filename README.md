# api

Fonction serverless Vercel : proxy générique pour tester des appels API sans être bloqué par le CORS.

## Endpoint

`POST /api/proxy`

Corps de la requête :

```json
{
  "targetUrl": "https://exemple.com/v3/reserved_stocks",
  "payload": { "...": "corps JSON à transmettre en POST à targetUrl" }
}
```

Réponse :

```json
{
  "ok": true,
  "status": 200,
  "statusText": "OK",
  "durationMs": 42,
  "data": { "...": "réponse JSON (ou texte brut) renvoyée par targetUrl" }
}
```

Le proxy relaie la requête côté serveur (évite le CORS) et refuse les cibles locales/privées (localhost, 127.0.0.1, plages IP privées, métadonnées cloud).

## Déploiement

Déployer ce dépôt sur [Vercel](https://vercel.com) : la fonction est automatiquement exposée sur `/api/proxy` une fois déployée (ou en local via `vercel dev`).
