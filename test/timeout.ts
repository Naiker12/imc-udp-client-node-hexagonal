import { UdpClientAdapter } from '../src/infrastructure/adapters/udp/UdpClientAdapter.js';
import { ConsultarImcUseCaseImpl } from '../src/application/usecases/ConsultarImcUseCaseImpl.js';

async function testTimeout() {
  console.log('Probando timeout con servidor inexistente en puerto 9999...');
  const client = new UdpClientAdapter({ serverHost: '127.0.0.1', serverPort: 9999, timeoutMs: 1500 });
  const useCase = new ConsultarImcUseCaseImpl(client);

  const res = await useCase.ejecutar({ peso: 70, altura: 1.75 });
  console.log('Resultado de timeout:', res);
  await client.cerrar();
}

testTimeout().catch(console.error);
