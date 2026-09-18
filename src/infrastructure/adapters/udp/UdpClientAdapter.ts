import dgram, { Socket } from 'node:dgram';
import { NetworkClientPort } from '../../../application/ports/out/NetworkClientPort.js';
import { SolicitudImc } from '../../../domain/model/SolicitudImc.js';
import { RespuestaImc } from '../../../domain/model/RespuestaImc.js';

export interface UdpClientConfig {
  serverHost: string;
  serverPort: number;
  timeoutMs?: number;
}

/**
 * Adaptador de infraestructura UDP que implementa NetworkClientPort.
 * Maneja la creación del socket, envío de datagramas, recepción asíncrona correlacionada por ID y timeout.
 */
export class UdpClientAdapter implements NetworkClientPort {
  private socket: Socket;
  private isClosed = false;

  constructor(private readonly config: UdpClientConfig) {
    this.socket = dgram.createSocket('udp4');
    this.socket.unref(); // Permite que el proceso de Node no quede colgado si no hay tareas activas
  }

  async enviarSolicitud(solicitud: SolicitudImc): Promise<RespuestaImc> {
    if (this.isClosed) {
      throw new Error('El socket del cliente UDP se encuentra cerrado.');
    }

    const timeoutLimit = this.config.timeoutMs ?? 4000;

    return new Promise<RespuestaImc>((resolve) => {
      let timer: NodeJS.Timeout;

      // Escuchador temporal correlacionado
      const messageHandler = (msg: Buffer) => {
        try {
          const rawText = msg.toString('utf-8');
          const data = JSON.parse(rawText);

          // Verificamos si la respuesta corresponde a nuestra solicitud
          if (!data.id || data.id === solicitud.id) {
            cleanup();

            if (data.status === 'SUCCESS' && data.data) {
              resolve(
                new RespuestaImc({
                  id: data.id,
                  status: 'SUCCESS',
                  imc: data.data.imc,
                  clasificacion: data.data.clasificacion,
                  interpretacion: data.data.interpretacion,
                  timestamp: data.timestamp
                })
              );
            } else {
              resolve(
                new RespuestaImc({
                  id: data.id,
                  status: 'ERROR',
                  errorMensaje: data.error?.mensaje || 'Error devuelto por el servidor.',
                  timestamp: data.timestamp
                })
              );
            }
          }
        } catch {
          // Si el paquete recibido no corresponde o es inválido, esperamos al siguiente datagrama o timeout
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.socket.removeListener('message', messageHandler);
      };

      // Establecemos temporizador para timeout en UDP
      timer = setTimeout(() => {
        cleanup();
        resolve(
          new RespuestaImc({
            id: solicitud.id,
            status: 'ERROR',
            errorMensaje: `Tiempo de espera agotado (${timeoutLimit}ms). El servidor UDP en ${this.config.serverHost}:${this.config.serverPort} no respondió o el paquete se perdió.`
          })
        );
      }, timeoutLimit);

      this.socket.on('message', messageHandler);

      // Preparamos y enviamos el datagrama UDP
      const payload = JSON.stringify({
        id: solicitud.id,
        peso: solicitud.peso,
        altura: solicitud.altura
      });

      const buffer = Buffer.from(payload, 'utf-8');

      this.socket.send(
        buffer,
        0,
        buffer.length,
        this.config.serverPort,
        this.config.serverHost,
        (err) => {
          if (err) {
            cleanup();
            resolve(
              new RespuestaImc({
                id: solicitud.id,
                status: 'ERROR',
                errorMensaje: `Error al enviar paquete UDP: ${err.message}`
              })
            );
          }
        }
      );
    });
  }

  async cerrar(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isClosed) {
        this.isClosed = true;
        this.socket.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
