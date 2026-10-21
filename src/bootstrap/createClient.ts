import { ConsultarImcUseCaseImpl } from '../application/usecases/ConsultarImcUseCaseImpl.js';
import { ConsoleCliAdapter } from '../infrastructure/adapters/cli/ConsoleCliAdapter.js';
import { UdpClientAdapter, UdpClientConfig } from '../infrastructure/adapters/udp/UdpClientAdapter.js';

/** Composition root: conecta los adaptadores con los puertos sin iniciar la consola. */
export function createClient(config: UdpClientConfig) {
  const network = new UdpClientAdapter(config);
  const useCase = new ConsultarImcUseCaseImpl(network);
  const cli = new ConsoleCliAdapter(useCase);
  return { network, useCase, cli };
}
