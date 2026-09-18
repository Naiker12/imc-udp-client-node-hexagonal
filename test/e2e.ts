import { UdpClientAdapter } from '../src/infrastructure/adapters/udp/UdpClientAdapter.js';
import { ConsultarImcUseCaseImpl } from '../src/application/usecases/ConsultarImcUseCaseImpl.js';

async function main() {
  console.log('--- Probando comunicación E2E con el servidor UDP ---');
  const clientAdapter = new UdpClientAdapter({
    serverHost: '127.0.0.1',
    serverPort: 9050,
    timeoutMs: 3000
  });

  const useCase = new ConsultarImcUseCaseImpl(clientAdapter);

  const testCases = [
    { label: 'Normal', peso: 70, altura: 1.75 },
    { label: 'Sobrepeso', peso: 85, altura: 1.70 },
    { label: 'Bajo peso', peso: 45, altura: 1.65 },
    { label: 'Datos inválidos', peso: -10, altura: 1.70 }
  ];

  for (const tc of testCases) {
    console.log(`\nProbando caso [${tc.label}]: peso=${tc.peso}, altura=${tc.altura}`);
    const res = await useCase.ejecutar({ peso: tc.peso, altura: tc.altura });
    console.log('Respuesta recibida:', JSON.stringify(res, null, 2));
  }

  await clientAdapter.cerrar();
  console.log('\n--- Pruebas E2E completadas con éxito ---');
}

main().catch(console.error);
