# api

Interface graphique + proxy serverless pour tester l'API des stocks réservés.

## Interface

Application React (Vite) avec une page de configuration (URL de base, Site ID, token — sauvegardés dans le navigateur) et un formulaire pour lancer un appel `GET {{url}}/v3/reserved_stocks` (avec corps JSON, comme dans Postman) (order_ids, filter.global, pagination) et consulter le résultat (statut, durée, JSON).

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
  "targetUrl": "https://api-qualif.onestock-retail.com/v3/reserved_stocks",
  "method": "GET",
  "payload": { "...": "corps JSON à transmettre à targetUrl" }
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

`method` est optionnel (`POST` par défaut ; `GET`, `PUT`, `PATCH`, `DELETE` acceptés). Le corps JSON est envoyé quelle que soit la méthode, y compris en `GET` : l'API OneStock l'exige.

Le proxy relaie la requête côté serveur (évite le CORS), coupe l'appel après 25 s et refuse les cibles locales/privées (localhost, 127.0.0.1, plages IP privées, métadonnées cloud).

## Déploiement

Déployer ce dépôt sur [Vercel](https://vercel.com) : le frontend est buildé automatiquement (Vite) et la fonction `/api/proxy` est exposée sans configuration supplémentaire. Le rewrite SPA de `vercel.json` exclut `/api/*` pour que les appels atteignent bien la fonction.
