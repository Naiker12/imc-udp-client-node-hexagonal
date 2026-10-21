import { NetworkClientPort } from '../../../application/ports/out/NetworkClientPort.js';
import { SolicitudImc } from '../../../domain/model/SolicitudImc.js';
import { RespuestaImc } from '../../../domain/model/RespuestaImc.js';

export interface RpcClientConfig { serverHost: string; serverPort: number; timeoutMs?: number }

export class RpcClientAdapter implements NetworkClientPort {
  private closed = false;
  private readonly pending = new Set<AbortController>();
  constructor(private readonly config: RpcClientConfig) {}

  async enviarSolicitud(solicitud: SolicitudImc): Promise<RespuestaImc> {
    if (this.closed) throw new Error('El cliente RPC se encuentra cerrado.');
    const controller = new AbortController();
    this.pending.add(controller);
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 4000);
    try {
      const response = await fetch(`http://${this.config.serverHost}:${this.config.serverPort}/rpc`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ id: solicitud.id, method: 'calcularImc',
          params: { peso: solicitud.peso, altura: solicitud.altura } })
      });
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object') throw new Error('Respuesta RPC inválida.');
      const envelope = value as Record<string, unknown>;
      if (envelope.id !== solicitud.id) throw new Error('Identificador RPC incorrecto.');
      if (!response.ok || envelope.error) throw new Error(`El servidor rechazó la invocación RPC (HTTP ${response.status}).`);
      if (!envelope.result || typeof envelope.result !== 'object') throw new Error('Resultado RPC inválido.');
      const result = envelope.result as Record<string, unknown>;
      if (result.id !== solicitud.id || typeof result.timestamp !== 'string') throw new Error('Resultado RPC inválido.');
      if (result.status === 'SUCCESS' && result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        if (typeof data.imc !== 'number' || !Number.isFinite(data.imc) || typeof data.clasificacion !== 'string' ||
            typeof data.interpretacion !== 'string') throw new Error('Datos RPC inválidos.');
        return new RespuestaImc({ id: solicitud.id, status: 'SUCCESS', imc: data.imc,
          clasificacion: data.clasificacion, interpretacion: data.interpretacion, timestamp: result.timestamp });
      }
      if (result.status === 'ERROR' && result.error && typeof result.error === 'object') {
        const error = result.error as Record<string, unknown>;
        if (typeof error.mensaje === 'string') return new RespuestaImc({ id: solicitud.id,
          status: 'ERROR', errorMensaje: error.mensaje, timestamp: result.timestamp });
      }
      throw new Error('Resultado RPC inválido.');
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Invocación RPC cancelada o tiempo de espera agotado.');
      throw error;
    } finally {
      clearTimeout(timer);
      this.pending.delete(controller);
    }
  }

  async cerrar(): Promise<void> {
    this.closed = true;
    for (const controller of this.pending) controller.abort();
  }
}
