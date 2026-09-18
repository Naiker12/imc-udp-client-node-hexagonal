import { SolicitudImc } from '../../../domain/model/SolicitudImc.js';
import { RespuestaImc } from '../../../domain/model/RespuestaImc.js';

/**
 * Puerto de salida (Driven Port) para el envío y recepción de paquetes a través de la red.
 * Desacopla la lógica de aplicación del protocolo subyacente (UDP, TCP, HTTP, etc.).
 */
export interface NetworkClientPort {
  enviarSolicitud(solicitud: SolicitudImc): Promise<RespuestaImc>;
  cerrar(): Promise<void>;
}
