import { createRpcClient } from './bootstrap/createRpcClient.js';

const { network, cli } = createRpcClient({
  serverHost: process.env.SERVER_HOST || '127.0.0.1',
  serverPort: Number(process.env.RPC_PORT || 9060),
  timeoutMs: Number(process.env.TIMEOUT_MS || 4000)
});

async function main() {
  try { await cli.iniciar(); }
  finally { await network.cerrar(); }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
