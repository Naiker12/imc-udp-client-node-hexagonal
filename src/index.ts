import { UdpClientAdapter } from './infrastructure/adapters/udp/UdpClientAdapter.js';
import { ConsultarImcUseCaseImpl } from './application/usecases/ConsultarImcUseCaseImpl.js';
import { ConsoleCliAdapter } from './infrastructure/adapters/cli/ConsoleCliAdapter.js';

const SERVER_HOST = process.env.SERVER_HOST || '127.0.0.1';
const SERVER_PORT = Number(process.env.SERVER_PORT) || 9050;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 4000;

const udpAdapter = new UdpClientAdapter({
  serverHost: SERVER_HOST,
  serverPort: SERVER_PORT,
  timeoutMs: TIMEOUT_MS
});

const consultarImcUseCase = new ConsultarImcUseCaseImpl(udpAdapter);
const cliAdapter = new ConsoleCliAdapter(consultarImcUseCase);

async function bootstrap() {
  try {
    await cliAdapter.iniciar();
  } finally {
    await udpAdapter.cerrar();
    process.exit(0);
  }
}

bootstrap();
