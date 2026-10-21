import { RespuestaImc } from '../../../domain/model/RespuestaImc.js';

/** Traduce el contrato JSON externo al modelo del cliente. */
export function decodeImcResponse(json: string, requestId: string): RespuestaImc | undefined {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const dto = value as Record<string, unknown>;
  if (dto.id !== requestId || typeof dto.timestamp !== 'string') return;
  if (dto.status === 'SUCCESS' && dto.data && typeof dto.data === 'object') {
    const data = dto.data as Record<string, unknown>;
    if (typeof data.imc !== 'number' || !Number.isFinite(data.imc) ||
        typeof data.clasificacion !== 'string' || typeof data.interpretacion !== 'string') return;
    return new RespuestaImc({ id: requestId, status: 'SUCCESS', imc: data.imc,
      clasificacion: data.clasificacion, interpretacion: data.interpretacion, timestamp: dto.timestamp });
  }
  if (dto.status === 'ERROR' && dto.error && typeof dto.error === 'object') {
    const error = dto.error as Record<string, unknown>;
    if (typeof error.mensaje !== 'string') return;
    return new RespuestaImc({ id: requestId, status: 'ERROR', errorMensaje: error.mensaje,
      timestamp: dto.timestamp });
  }
}
