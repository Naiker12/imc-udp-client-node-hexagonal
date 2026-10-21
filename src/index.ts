import { createClient } from './bootstrap/createClient.js';

const { network, cli } = createClient({
  serverHost: process.env.SERVER_HOST || '127.0.0.1',
  serverPort: Number(process.env.SERVER_PORT || 9050),
  timeoutMs: Number(process.env.TIMEOUT_MS || 4000)
});

async function bootstrap() {
  try { await cli.iniciar(); }
  finally { await network.cerrar(); }
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
