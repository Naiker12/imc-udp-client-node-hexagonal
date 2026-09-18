import { RespuestaImc } from '../../../domain/model/RespuestaImc.js';

export interface ConsultarImcRequestDto {
  peso: number;
  altura: number;
  id?: string;
}

/**
 * Puerto de entrada (Driving Port) para que la interfaz de usuario (CLI/Web) solicite el cálculo del IMC.
 */
export interface ConsultarImcUseCase {
  ejecutar(dto: ConsultarImcRequestDto): Promise<RespuestaImc>;
}
