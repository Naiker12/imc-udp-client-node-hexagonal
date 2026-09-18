/**
 * Entidad de dominio en el cliente que representa los parámetros para consultar el IMC.
 */
export class SolicitudImc {
  readonly id: string;
  readonly peso: number;
  readonly altura: number;

  constructor(peso: number, altura: number, id?: string) {
    if (typeof peso !== 'number' || isNaN(peso) || peso <= 0) {
      throw new Error('El peso ingresado debe ser un número positivo mayor a cero.');
    }
    if (typeof altura !== 'number' || isNaN(altura) || altura <= 0) {
      throw new Error('La altura ingresada debe ser un número positivo mayor a cero.');
    }

    this.id = id || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.peso = peso;
    this.altura = altura;
  }
}
