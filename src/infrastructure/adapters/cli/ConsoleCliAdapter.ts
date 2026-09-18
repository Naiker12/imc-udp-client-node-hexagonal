import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ConsultarImcUseCase } from '../../../application/ports/in/ConsultarImcUseCase.js';

/**
 * Adaptador de interfaz de usuario de consola (Driving Adapter).
 * Permite interactuar con el usuario en la terminal, solicitar datos y presentar la respuesta.
 */
export class ConsoleCliAdapter {
  constructor(private readonly consultarImcUseCase: ConsultarImcUseCase) {}

  async iniciar(): Promise<void> {
    const rl = readline.createInterface({ input, output });

    console.clear();
    this.mostrarEncabezado();

    let continuar = true;

    while (continuar) {
      try {
        console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
        console.log('\x1b[1m📋 Ingrese los datos del paciente para la consulta UDP:\x1b[0m');

        const pesoStr = await rl.question('\x1b[33m▶ Peso en kilogramos (ej: 75.5):\x1b[0m ');
        const alturaStr = await rl.question('\x1b[33m▶ Altura en metros o cm (ej: 1.75 o 175):\x1b[0m ');

        const peso = parseFloat(pesoStr.trim().replace(',', '.'));
        const altura = parseFloat(alturaStr.trim().replace(',', '.'));

        if (isNaN(peso) || isNaN(altura)) {
          console.log('\x1b[31m✖ Error: Tanto el peso como la altura deben ser valores numéricos válidos.\x1b[0m');
        } else {
          console.log('\n\x1b[90m⏳ Enviando datagrama UDP al servidor...\x1b[0m');
          const startTime = performance.now();

          const respuesta = await this.consultarImcUseCase.ejecutar({ peso, altura });
          const elapsed = (performance.now() - startTime).toFixed(1);

          this.mostrarResultado(respuesta, elapsed);
        }

        const respuestaSeguir = await rl.question('\n\x1b[90m¿Desea realizar otro cálculo? (s/n) [s]:\x1b[0m ');
        if (respuestaSeguir.trim().toLowerCase() === 'n') {
          continuar = false;
        }
      } catch (err: unknown) {
        console.log(`\x1b[31m✖ Error inesperado: ${err instanceof Error ? err.message : String(err)}\x1b[0m`);
      }
    }

    console.log('\n\x1b[32m✔ Sesión finalizada. ¡Hasta luego!\x1b[0m\n');
    rl.close();
  }

  private mostrarEncabezado(): void {
    console.log('\x1b[34m============================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m   🩺 CALCULADORA DE IMC — CLIENTE UDP / IP (HEXAGONAL)   \x1b[0m');
    console.log('\x1b[34m============================================================\x1b[0m');
    console.log('\x1b[90m Protocolo: Datagramas UDP | Arquitectura: Ports & Adapters \x1b[0m');
  }

  private mostrarResultado(respuesta: any, elapsedMs: string): void {
    console.log('\n\x1b[36m┌─────────────────── RESULTADO DEL SERVIDOR ────────────────┐\x1b[0m');

    if (respuesta.esExitosa()) {
      const colorClasificacion = this.obtenerColorClasificacion(respuesta.clasificacion);

      console.log(`│ \x1b[1mID Petición:\x1b[0m      ${respuesta.id || 'N/A'}`);
      console.log(`│ \x1b[1mÍndice IMC:\x1b[0m       \x1b[32m\x1b[1m${respuesta.imc}\x1b[0m kg/m²`);
      console.log(`│ \x1b[1mClasificación:\x1b[0m    ${colorClasificacion}${respuesta.clasificacion}\x1b[0m`);
      console.log(`│ \x1b[1mInterpretación:\x1b[0m   ${respuesta.interpretacion}`);
      console.log(`│ \x1b[1mTiempo RTT:\x1b[0m       \x1b[90m${elapsedMs} ms\x1b[0m`);
    } else {
      console.log(`│ \x1b[31m\x1b[1mESTADO:\x1b[0m           ERROR`);
      console.log(`│ \x1b[31m\x1b[1mDetalle:\x1b[0m          ${respuesta.errorMensaje}\x1b[0m`);
      console.log(`│ \x1b[1mTiempo:\x1b[0m           \x1b[90m${elapsedMs} ms\x1b[0m`);
    }

    console.log('\x1b[36m└───────────────────────────────────────────────────────────┘\x1b[0m');
  }

  private obtenerColorClasificacion(clasificacion?: string): string {
    switch (clasificacion) {
      case 'Normal (Peso saludable)':
        return '\x1b[32m\x1b[1m'; // Verde
      case 'Bajo peso':
        return '\x1b[33m\x1b[1m'; // Amarillo
      case 'Sobrepeso':
        return '\x1b[33m\x1b[1m'; // Amarillo
      case 'Obesidad Clase I':
      case 'Obesidad Clase II':
      case 'Obesidad Clase III':
        return '\x1b[31m\x1b[1m'; // Rojo
      default:
        return '\x1b[37m';
    }
  }
}
