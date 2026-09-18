import { describe, it, expect, vi } from 'vitest';
import { ConsultarImcUseCaseImpl } from '../../src/application/usecases/ConsultarImcUseCaseImpl.js';
import { NetworkClientPort } from '../../src/application/ports/out/NetworkClientPort.js';
import { RespuestaImc } from '../../src/domain/model/RespuestaImc.js';
import { SolicitudImc } from '../../src/domain/model/SolicitudImc.js';

describe('ConsultarImcUseCaseImpl (Client Application)', () => {
  it('debe enviar la solicitud al puerto de red y retornar la respuesta exitosa', async () => {
    const mockNetworkPort: NetworkClientPort = {
      enviarSolicitud: vi.fn().mockResolvedValue(
        new RespuestaImc({
          id: 'test-id-1',
          status: 'SUCCESS',
          imc: 22.86,
          clasificacion: 'Normal (Peso saludable)',
          interpretacion: 'Rango óptimo'
        })
      ),
      cerrar: vi.fn().mockResolvedValue(undefined)
    };

    const useCase = new ConsultarImcUseCaseImpl(mockNetworkPort);

    const respuesta = await useCase.ejecutar({
      id: 'test-id-1',
      peso: 70,
      altura: 1.75
    });

    expect(mockNetworkPort.enviarSolicitud).toHaveBeenCalledOnce();
    expect(respuesta.esExitosa()).toBe(true);
    expect(respuesta.imc).toBe(22.86);
    expect(respuesta.clasificacion).toBe('Normal (Peso saludable)');
  });

  it('debe capturar errores de validación de entrada sin consultar la red', async () => {
    const mockNetworkPort: NetworkClientPort = {
      enviarSolicitud: vi.fn(),
      cerrar: vi.fn().mockResolvedValue(undefined)
    };

    const useCase = new ConsultarImcUseCaseImpl(mockNetworkPort);

    const respuesta = await useCase.ejecutar({
      peso: -10,
      altura: 1.75
    });

    expect(mockNetworkPort.enviarSolicitud).not.toHaveBeenCalled();
    expect(respuesta.esExitosa()).toBe(false);
    expect(respuesta.errorMensaje).toContain('El peso ingresado debe ser un número positivo mayor a cero');
  });
});
