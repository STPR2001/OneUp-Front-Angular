import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private readonly POINTS_CONVERSION_FACTOR = 100; // $100 = 1 punto
  private readonly POINT_VALUE = 10; // 1 punto = $10 en descuentos
  private readonly MAX_DISCOUNT_PERCENTAGE = 0.5; // 50% máximo de descuento

  constructor() { }

  /**
   * Calcula los puntos generados por una cantidad de dinero
   * @param amount Monto en pesos
   * @returns Número de puntos generados
   */
  calculatePointsFromAmount(amount: number): number {
    return Math.floor(amount / this.POINTS_CONVERSION_FACTOR);
  }

  /**
   * Calcula los puntos generados por una reparación
   * @param repair Objeto de reparación
   * @returns Número de puntos o null si la reparación no está entregada
   */
  calculateRepairPoints(repair: any): number | null {
    if (repair.estado?.toLowerCase() !== 'entregada') {
      return null;
    }
    const totalAmount = (repair.manoDeObra || 0) + (repair.entrega || 0);
    return this.calculatePointsFromAmount(totalAmount);
  }

  /**
   * Calcula el valor en pesos de una cantidad de puntos
   * @param points Número de puntos
   * @returns Valor en pesos
   */
  calculatePointsValue(points: number): number {
    return points * this.POINT_VALUE;
  }

  /**
   * Calcula el máximo de puntos que se pueden usar en una reparación
   * @param totalAmount Monto total de la reparación
   * @param availablePoints Puntos disponibles del cliente
   * @returns Número máximo de puntos que se pueden usar
   */
  calculateMaxPointsToUse(totalAmount: number, availablePoints: number): number {
    const maxDiscountAmount = totalAmount * this.MAX_DISCOUNT_PERCENTAGE;
    const maxPointsByDiscount = Math.floor(maxDiscountAmount / this.POINT_VALUE);
    const maxPointsByTotal = Math.floor(totalAmount / this.POINT_VALUE);
    return Math.min(availablePoints, maxPointsByTotal, maxPointsByDiscount);
  }

  /**
   * Verifica si un descuento supera el máximo permitido
   * @param totalAmount Monto total de la reparación
   * @param pointsToUse Puntos a utilizar
   * @returns true si supera el máximo permitido
   */
  exceedsMaxDiscount(totalAmount: number, pointsToUse: number): boolean {
    const discountAmount = this.calculatePointsValue(pointsToUse);
    return discountAmount > (totalAmount * this.MAX_DISCOUNT_PERCENTAGE);
  }

  /**
   * Calcula los puntos usados en una reparación
   * @param repair Objeto de reparación
   * @returns Número de puntos usados
   */
  calculateUsedPoints(repair: any): number {
    // Si la reparación tiene un descuento por puntos, calculamos cuántos puntos se usaron
    const descuento = repair.descuentoPuntos || 0;
    return Math.floor(descuento / this.POINT_VALUE);
  }

  /**
   * Calcula el total de puntos acumulados en un conjunto de reparaciones
   * @param repairs Array de reparaciones
   * @returns Total de puntos acumulados
   */
  calculateTotalPoints(repairs: any[]): number {
    return repairs.reduce((total, repair) => {
      // Puntos generados por esta reparación
      const pointsGenerated = this.calculateRepairPoints(repair) || 0;
      // Puntos usados en esta reparación
      const pointsUsed = this.calculateUsedPoints(repair);
      // Sumamos los puntos generados y restamos los usados
      return total + pointsGenerated - pointsUsed;
    }, 0);
  }
} 