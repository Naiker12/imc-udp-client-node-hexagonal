import assert from 'node:assert/strict';
import { createRpcClient } from '../dist/bootstrap/createRpcClient.js';
import { createRpcServer } from '../../imc-udp-server-node-hexagonal/dist/bootstrap/createRpcServer.js';

// Compilar ambos proyectos antes de ejecutar. El servidor usa un puerto libre.
const { server } = createRpcServer({ host: '127.0.0.1', port: 0 }, { info() {}, warn() {}, error() {} });
let client;
try {
  await server.start();
  const address = server.address();
  assert(address && typeof address !== 'string');
  client = createRpcClient({ serverHost: '127.0.0.1', serverPort: address.port });
  const results = await Promise.all([1.75, 175].map(altura => client.useCase.ejecutar({ peso: 70, altura })));
  for (const result of results) {
    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.imc, 22.86);
  }
  const invalid = await client.useCase.ejecutar({ peso: 501, altura: 175 });
  assert.equal(invalid.status, 'ERROR');
  assert.match(invalid.errorMensaje, /500/);
  console.log('RPC E2E correcto: consultas concurrentes, metros, centímetros y validación del servidor.');
} finally {
  if (client) await client.network.cerrar();
  await server.stop();
}
