# api

Interface graphique + proxy serverless pour tester l'API des stocks réservés.

## Interface

Application React (Vite) avec une page de configuration (URL de base, Site ID, token — sauvegardés dans le navigateur) et un formulaire pour lancer un appel `POST {{url}}/v3/reserved_stocks` (order_ids, filter.global, pagination) et consulter le résultat (statut, durée, JSON).

```bash
npm install
npm run dev
```

> ⚠️ L'appel réel passe par `/api/proxy`, une fonction serverless Vercel. Cette route n'existe pas avec `npm run dev` seul : utilisez `vercel dev` en local, ou déployez sur Vercel.

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

Le proxy relaie la requête côté serveur (évite le CORS) et refuse les cibles locales/privées (localhost, 127.0.0.1, plages IP privées, métadonnées cloud).

## Déploiement

Déployer ce dépôt sur [Vercel](https://vercel.com) : le frontend est buildé automatiquement (Vite) et la fonction `/api/proxy` est exposée sans configuration supplémentaire.
