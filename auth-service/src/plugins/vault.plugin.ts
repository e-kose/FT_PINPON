import fp from 'fastify-plugin';
import axios from 'axios';

export default fp(async (app) => {
  const VAULT_ADDR = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
  const VAULT_TOKEN = process.env.VAULT_TOKEN || 'devroot';

  const secretPaths = ['auth'];

  async function readSecret(path: string) {
    const url = `${VAULT_ADDR}/v1/secret/data/${path}`;
    const res = await axios.get(url, {
      headers: { 'X-Vault-Token': VAULT_TOKEN }
    });
    return res.data?.data?.data ?? null;
  }

  const secrets: Record<string, any> = {};
  for (const path of secretPaths) {
    try {
      secrets[path] = await readSecret(path);
      app.log.info(`Vault secret loaded: ${path}`);
    } catch (err: any) {
      app.log.error(`Error loading secret ${path}: ${err.message}`);
    }
  }

  app.decorate('vaultSecrets', secrets);
});

