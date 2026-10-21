import { describe, it, expect } from 'vitest';
import http from 'node:http';
import { createRpcClient } from '../../src/bootstrap/createRpcClient.js';

describe('Cliente RPC por HTTP', () => {
  it('envía el método remoto y rechaza resultados con otro id', async () => {
    let wrongId = false;
    const server = http.createServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) body += chunk.toString();
      const dto = JSON.parse(body);
      expect(dto.method).toBe('calcularImc');
      expect(dto.params).toEqual({ peso: 70, altura: 175 });
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: wrongId ? 'otro' : dto.id, result: {
        id: dto.id, status: 'SUCCESS', data: { imc: 22.86, clasificacion: 'Normal', interpretacion: 'Prueba' },
        timestamp: new Date().toISOString()
      } }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Sin puerto');
    const { network, useCase } = createRpcClient({ serverHost: '127.0.0.1', serverPort: address.port });
    try {
      expect((await useCase.ejecutar({ peso: 70, altura: 175 })).imc).toBe(22.86);
      wrongId = true;
      expect((await useCase.ejecutar({ peso: 70, altura: 175 })).errorMensaje).toContain('Identificador');
      await network.cerrar();
      expect((await useCase.ejecutar({ peso: 70, altura: 175 })).errorMensaje).toContain('cerrado');
    } finally {
      await network.cerrar();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('termina la consulta al agotarse el tiempo de espera', async () => {
    const server = http.createServer(() => {});
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Sin puerto');
    const { network, useCase } = createRpcClient({ serverHost: '127.0.0.1', serverPort: address.port, timeoutMs: 100 });
    try {
      const result = await useCase.ejecutar({ peso: 70, altura: 175 });
      expect(result.errorMensaje).toContain('tiempo de espera');
    } finally {
      await network.cerrar();
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
