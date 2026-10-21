import { describe, it, expect } from 'vitest';
import dgram from 'node:dgram';
import { createClient } from '../../src/bootstrap/createClient.js';

describe('Cliente UDP real', () => {
  it('ignora respuestas sin id y correlaciona consultas concurrentes', async () => {
    const server = dgram.createSocket('udp4');
    await new Promise<void>(resolve => server.bind(0, '127.0.0.1', resolve));
    const { network, useCase } = createClient({ serverHost: '127.0.0.1',
      serverPort: server.address().port, timeoutMs: 500 });
    server.on('message', (msg, remote) => {
      const dto = JSON.parse(msg.toString());
      server.send(JSON.stringify({ status: 'ERROR', error: { mensaje: 'Sin id' } }), remote.port, remote.address);
      server.send(JSON.stringify({ id: dto.id, status: 'SUCCESS', data: { imc: dto.peso,
        clasificacion: 'Prueba', interpretacion: 'Prueba' }, timestamp: new Date().toISOString() }), remote.port, remote.address);
    });
    try {
      const responses = await Promise.all([10, 20].map(peso =>
        useCase.ejecutar({ id: String(peso), peso, altura: 1.75 })));
      expect(responses.map(r => r.imc)).toEqual([10, 20]);
    } finally {
      await network.cerrar();
      server.close();
    }
  });

  it('permite cerrar antes de enviar y rechaza valores infinitos sin red', async () => {
    const { network, useCase } = createClient({ serverHost: '127.0.0.1', serverPort: 9050 });
    expect((await useCase.ejecutar({ peso: Infinity, altura: 1.75 })).esExitosa()).toBe(false);
    await network.cerrar();
    await network.cerrar();
  });
});
