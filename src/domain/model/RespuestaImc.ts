/**
 * Entidad de dominio en el cliente que encapsula la respuesta recibida del servidor.
 */
export class RespuestaImc {
  readonly id?: string;
  readonly status: 'SUCCESS' | 'ERROR';
  readonly imc?: number;
  readonly clasificacion?: string;
  readonly interpretacion?: string;
  readonly errorMensaje?: string;
  readonly timestamp: string;

  constructor(params: {
    id?: string;
    status: 'SUCCESS' | 'ERROR';
    imc?: number;
    clasificacion?: string;
    interpretacion?: string;
    errorMensaje?: string;
    timestamp?: string;
  }) {
    this.id = params.id;
    this.status = params.status;
    this.imc = params.imc;
    this.clasificacion = params.clasificacion;
    this.interpretacion = params.interpretacion;
    this.errorMensaje = params.errorMensaje;
    this.timestamp = params.timestamp || new Date().toISOString();
  }

  esExitosa(): boolean {
    return this.status === 'SUCCESS';
  }
}
