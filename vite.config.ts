import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import proxyHandler from './api/proxy';

// Expose la fonction serverless /api/proxy pendant `npm run dev`,
// pour tester sans `vercel dev`. En production, Vercel sert api/proxy.ts directement.
function devApiProxy(): Plugin {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req: any, res: any) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          req.body = raw ? JSON.parse(raw) : {};
        } catch {
          req.body = {};
        }
        res.status = (code: number) => {
          res.statusCode = code;
          return res;
        };
        res.json = (body: unknown) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        await proxyHandler(req, res);
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});
