import { decodeImcResponse } from './ImcResponseJson.js';
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
  private readonly pending = new Set<(message: string) => void>();

  constructor(private readonly config: UdpClientConfig) {
    this.socket = dgram.createSocket('udp4');
    this.socket.unref();
    this.socket.on('error', (error: Error) => {
      for (const cancel of this.pending) cancel(error.message);
    });
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
          const respuesta = decodeImcResponse(msg.toString('utf-8'), solicitud.id);
          if (respuesta) {
            cleanup();
            resolve(respuesta);
          }
        } catch {
          // Si el paquete recibido no corresponde o es inválido, esperamos al siguiente datagrama o timeout
        }
      };

      const cancel = (message: string) => {
        cleanup();
        resolve(new RespuestaImc({ id: solicitud.id, status: 'ERROR', errorMensaje: message }));
      };
      const cleanup = () => {
        this.pending.delete(cancel);
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

      this.pending.add(cancel);
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
        for (const cancel of this.pending) cancel('El cliente UDP se ha cerrado.');
        try {
          this.socket.close(() => resolve());
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ERR_SOCKET_DGRAM_NOT_RUNNING') resolve();
          else throw error;
        }
      } else {
        resolve();
      }
    });
  }
}
