import {
  ConsultarImcUseCase,
  ConsultarImcRequestDto
} from '../ports/in/ConsultarImcUseCase.js';
import { NetworkClientPort } from '../ports/out/NetworkClientPort.js';
import { SolicitudImc } from '../../domain/model/SolicitudImc.js';
import { RespuestaImc } from '../../domain/model/RespuestaImc.js';

/**
 * Implementación del caso de uso del cliente.
 * Construye la entidad de dominio y utiliza el puerto de salida de red.
 */
export class ConsultarImcUseCaseImpl implements ConsultarImcUseCase {
  constructor(private readonly networkPort: NetworkClientPort) {}

  async ejecutar(dto: ConsultarImcRequestDto): Promise<RespuestaImc> {
    try {
      const solicitud = new SolicitudImc(dto.peso, dto.altura, dto.id);
      return await this.networkPort.enviarSolicitud(solicitud);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido al procesar la solicitud.';
      return new RespuestaImc({
        id: dto.id,
        status: 'ERROR',
        errorMensaje: mensaje
      });
    }
  }
}
