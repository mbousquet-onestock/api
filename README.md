# api

Interface graphique + proxy serverless pour tester l'API des stocks réservés.

## Interface

Application React (Vite) avec une page de configuration (URL de base, Site ID, token — sauvegardés dans le navigateur) et un formulaire pour lancer un appel `POST {{url}}/v3/reserved_stocks` (order_ids, filter.global, pagination) et consulter le résultat (statut, durée, JSON).

```bash
npm install
npm run dev
```

> L'appel réel passe par `/api/proxy`, une fonction serverless Vercel. En local, `npm run dev` expose aussi cette route (middleware Vite qui réutilise le même handler), donc pas besoin de `vercel dev`.

## Fonction proxy

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

Le proxy relaie la requête côté serveur (évite le CORS), coupe l'appel après 25 s et refuse les cibles locales/privées (localhost, 127.0.0.1, plages IP privées, métadonnées cloud).

## Déploiement

Déployer ce dépôt sur [Vercel](https://vercel.com) : le frontend est buildé automatiquement (Vite) et la fonction `/api/proxy` est exposée sans configuration supplémentaire. Le rewrite SPA de `vercel.json` exclut `/api/*` pour que les appels atteignent bien la fonction.
