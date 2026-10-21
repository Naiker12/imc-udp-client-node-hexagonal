import { ConsultarImcUseCaseImpl } from '../application/usecases/ConsultarImcUseCaseImpl.js';
import { ConsoleCliAdapter } from '../infrastructure/adapters/cli/ConsoleCliAdapter.js';
import { RpcClientAdapter, RpcClientConfig } from '../infrastructure/adapters/rpc/RpcClientAdapter.js';

export function createRpcClient(config: RpcClientConfig) {
  const network = new RpcClientAdapter(config);
  const useCase = new ConsultarImcUseCaseImpl(network);
  const cli = new ConsoleCliAdapter(useCase, 'RPC');
  return { network, useCase, cli };
}
