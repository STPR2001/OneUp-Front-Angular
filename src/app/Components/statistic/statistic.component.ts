import { Component, OnInit } from '@angular/core';
import { CanvasJS } from '@canvasjs/angular-charts';
import { RepairsService } from 'src/app/services/repairs.service';
import { ShoppingService } from 'src/app/services/shopping.service';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css'],
})
export class StatisticComponent implements OnInit {
  selectedYear: number = new Date().getFullYear();
  reparaciones: any[] = [];
  chartColors = {
    primary: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8'
  };

  constructor(
    private shoppingService: ShoppingService,
    private repairsService: RepairsService
  ) {}

  ngOnInit(): void {
    this.cargarReparaciones();
    this.renderAllCharts();
  }

  cargarReparaciones() {
    this.repairsService.getAllReparaciones().subscribe(
      (data) => {
        this.reparaciones = data;
        this.renderAllCharts();
      },
      (error) => {
        console.error('Error al cargar reparaciones:', error);
      }
    );
  }

  // Funciones para las estadísticas básicas
  getReparacionesEnTaller(): number {
    return this.reparaciones.filter(r => r.estado === 'En taller' && r.activo).length;
  }

  getReparacionesFinalizadas(): number {
    return this.reparaciones.filter(r => r.estado === 'Finalizada' && r.activo).length;
  }

  getReparacionesEntregadas(): number {
    return this.reparaciones.filter(r => r.estado === 'Entregada' && r.activo).length;
  }

  getTotalReparaciones(): number {
    return this.reparaciones.filter(r => r.activo).length;
  }

  // Funciones para estadísticas detalladas
  getEstadisticasGenerales() {
    const reparacionesActivas = this.reparaciones.filter(r => r.activo);
    return {
      totalReparaciones: reparacionesActivas.length,
      reparacionesUrgentes: reparacionesActivas.filter(r => this.getDiasEnTaller(r) > 7 && r.estado === 'En taller').length,
      ingresosMensuales: this.calcularIngresosMensuales(),
      promedioTiempoReparacion: this.calcularPromedioTiempoReparacion(),
      clientesRecurrentes: this.obtenerClientesRecurrentes(),
      tecnicoMasProductivo: this.obtenerTecnicoMasProductivo()
    };
  }

  getDiasEnTaller(reparacion: any): number {
    const inicio = new Date(reparacion.fechaIngreso);
    const fin = reparacion.fechaEntrega ? new Date(reparacion.fechaEntrega) : new Date();
    return Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  }

  calcularIngresosMensuales(): number {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    console.log('Calculando ingresos para:', {
      mes: mesActual + 1,
      anio: anioActual
    });

    console.log('Total de reparaciones antes del filtro:', this.reparaciones.length);
    
    const reparacionesEntregadas = this.reparaciones.filter(r => {
      // Inspeccionar el objeto completo
      console.log('Evaluando reparación completa:', r);

      // Verificar específicamente la propiedad activo
      console.log('Tipo de activo:', typeof r.activo, 'Valor de activo:', r.activo);

      // Cambiar la lógica de verificación de activo
      if (r.activo === undefined || r.activo === null) {
        console.log('La propiedad activo no está definida, asumiendo como activa');
      } else if (r.activo === false) {
        console.log('Reparación descartada: está explícitamente inactiva');
        return false;
      }
      
      if (r.estado !== 'Entregada') {
        console.log('Reparación descartada: no está entregada');
        return false;
      }
      
      if (!r.fechaEntrega) {
        console.log('Reparación descartada: no tiene fecha de entrega');
        return false;
      }
      
      const fechaEntrega = new Date(r.fechaEntrega);
      const mesEntrega = fechaEntrega.getMonth();
      const anioEntrega = fechaEntrega.getFullYear();
      
      const estaEnMesActual = mesEntrega === mesActual && anioEntrega === anioActual;
      
      if (!estaEnMesActual) {
        console.log(`Reparación descartada: fecha fuera del mes actual - Mes: ${mesEntrega + 1}, Año: ${anioEntrega}`);
      } else {
        console.log('Reparación aceptada para el cálculo');
      }
      
      return estaEnMesActual;
    });
    
    console.log('Reparaciones entregadas este mes:', reparacionesEntregadas);
    
    const total = reparacionesEntregadas.reduce((total, r) => {
      const subtotal = (r.manoDeObra || 0) + (r.entrega || 0);
      console.log(`Sumando reparación ${r.id}: manoDeObra=${r.manoDeObra}, entrega=${r.entrega}, subtotal=${subtotal}`);
      return total + subtotal;
    }, 0);
    
    console.log('Total ingresos del mes:', total);
    
    return total;
  }

  calcularPromedioTiempoReparacion(): number {
    const reparacionesFinalizadas = this.reparaciones.filter(r => 
      r.activo === true && r.estado === 'Entregada'
    );

    if (reparacionesFinalizadas.length === 0) return 0;

    const tiempoTotal = reparacionesFinalizadas.reduce((total, r) => {
      const inicio = new Date(r.fechaIngreso);
      const fin = r.fechaEntrega ? new Date(r.fechaEntrega) : new Date();
      const diasEnTaller = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      return total + diasEnTaller;
    }, 0);

    return Math.round(tiempoTotal / reparacionesFinalizadas.length);
  }

  obtenerClientesRecurrentes(): number {
    const clientesConReparaciones: { [key: string]: number } = this.reparaciones
      .filter(r => r.activo)
      .reduce((acc: { [key: string]: number }, r) => {
        acc[r.cliente.id] = (acc[r.cliente.id] || 0) + 1;
        return acc;
      }, {});

    return Object.values(clientesConReparaciones)
      .filter(cantidad => cantidad > 1)
      .length;
  }

  obtenerTecnicoMasProductivo(): string {
    const reparacionesPorTecnico: { [key: string]: number } = this.reparaciones
      .filter(r => r.activo && (r.estado === 'Finalizada' || r.estado === 'Entregada'))
      .reduce((acc: { [key: string]: number }, r) => {
        acc[r.tecnico.nombre] = (acc[r.tecnico.nombre] || 0) + 1;
        return acc;
      }, {});

    if (Object.keys(reparacionesPorTecnico).length === 0) return 'N/A';

    const [tecnicoMasProductivo] = Object.entries(reparacionesPorTecnico)
      .reduce(([maxTecnico, maxCantidad]: [string, number], [tecnico, cantidad]: [string, number]) => 
        cantidad > maxCantidad ? [tecnico, cantidad] : [maxTecnico, maxCantidad]
      , ['', 0]);

    return tecnicoMasProductivo;
  }

  renderAllCharts(): void {
    this.renderReparacionesPorMesChart();
    this.renderGastosEnElAnoChart();
    this.renderComprasPorProveedorChart();
    this.renderReparacionesPorTecnicoChart();
  }

  renderReparacionesPorMesChart() {
    this.repairsService.getReparacionesPorMes(this.selectedYear).subscribe(
      (data) => {
        console.log('Datos de reparaciones por mes:', data);
        const dataPoints = this.mapDataToDataPoints(data || []);
        if (!dataPoints || dataPoints.length === 0) {
          console.log('No hay datos válidos para mostrar en la gráfica de reparaciones');
          this.showNoData('reparacionesPorMes');
        } else {
          this.renderChart('reparacionesPorMes', 'Reparaciones por Mes', dataPoints, 'column');
        }
      },
      error => {
        console.error('Error al obtener datos de reparaciones:', error);
        this.showNoData('reparacionesPorMes');
      }
    );
  }

  renderGastosEnElAnoChart() {
    this.shoppingService.getComprasPorMes(this.selectedYear).subscribe(
      (data) => {
        console.log('Datos de gastos por mes:', data);
        const dataPoints = this.mapDataToDataPoints(data || []);
        if (!dataPoints || dataPoints.length === 0) {
          console.log('No hay datos válidos para mostrar en la gráfica de gastos');
          this.showNoData('gastosEnElAno');
        } else {
          this.renderChart('gastosEnElAno', 'Gastos Mensuales', dataPoints, 'area');
        }
      },
      error => {
        console.error('Error al obtener datos de gastos:', error);
        this.showNoData('gastosEnElAno');
      }
    );
  }

  renderComprasPorProveedorChart() {
    this.shoppingService.getComprasPorProveedor(this.selectedYear).subscribe(
      (data) => {
        console.log('Datos de compras por proveedor:', data);
        const dataPoints = this.mapDataToDataPoints(data || []);
        if (!dataPoints || dataPoints.length === 0) {
          console.log('No hay datos válidos para mostrar en la gráfica de proveedores');
          this.showNoData('comprasPorProveedor');
        } else {
          this.renderDoughnutChart('comprasPorProveedor', 'Distribución de Compras por Proveedor', dataPoints);
        }
      },
      error => {
        console.error('Error al obtener datos de proveedores:', error);
        this.showNoData('comprasPorProveedor');
      }
    );
  }

  renderReparacionesPorTecnicoChart() {
    this.repairsService.getReparacionesPorTecnico(this.selectedYear).subscribe(
      (data) => {
        console.log('Datos de reparaciones por técnico:', data);
        const dataPoints = this.mapDataToDataPoints(data || []);
        if (!dataPoints || dataPoints.length === 0) {
          console.log('No hay datos válidos para mostrar en la gráfica de técnicos');
          this.showNoData('reparacionesPorTecnico');
        } else {
          this.renderBarChart('reparacionesPorTecnico', 'Rendimiento por Técnico', dataPoints);
        }
      },
      error => {
        console.error('Error al obtener datos de técnicos:', error);
        this.showNoData('reparacionesPorTecnico');
      }
    );
  }

  renderTiempoPromedioReparacionChart() {
    // Implementar cuando el backend proporcione estos datos
    const dummyData = [
      { label: 'Ene', y: 5 }, { label: 'Feb', y: 4 },
      { label: 'Mar', y: 6 }, { label: 'Abr', y: 4 },
      { label: 'May', y: 5 }, { label: 'Jun', y: 7 }
    ];

    new CanvasJS.Chart('tiempoPromedioReparacion', {
      animationEnabled: true,
      theme: 'light2',
      title: {
        text: 'Tiempo Promedio de Reparación',
        fontSize: 16,
        padding: 10
      },
      axisY: {
        title: 'Días',
        titleFontSize: 14
      },
      data: [{
        type: 'line',
        color: this.chartColors.warning,
        dataPoints: dummyData
      }],
      backgroundColor: 'transparent'
    }).render();
  }

  renderSatisfaccionClientesChart() {
    // Implementar cuando el backend proporcione estos datos
    const dummyData = [
      { label: 'Muy Satisfecho', y: 65 },
      { label: 'Satisfecho', y: 25 },
      { label: 'Neutral', y: 7 },
      { label: 'Insatisfecho', y: 3 }
    ];

    new CanvasJS.Chart('satisfaccionClientes', {
      animationEnabled: true,
      theme: 'light2',
      title: {
        text: 'Satisfacción del Cliente',
        fontSize: 16,
        padding: 10
      },
      data: [{
        type: 'pie',
        startAngle: 240,
        indexLabelFontSize: 12,
        dataPoints: dummyData
      }],
      backgroundColor: 'transparent'
    }).render();
  }

  renderIngresosPorTipoChart() {
    // Implementar cuando el backend proporcione estos datos
    const dummyData = [
      { label: 'Reparaciones', y: 70 },
      { label: 'Repuestos', y: 20 },
      { label: 'Otros', y: 10 }
    ];

    new CanvasJS.Chart('ingresosPorTipo', {
      animationEnabled: true,
      theme: 'light2',
      title: {
        text: 'Distribución de Ingresos',
        fontSize: 16,
        padding: 10
      },
      data: [{
        type: 'doughnut',
        innerRadius: '60%',
        indexLabelFontSize: 12,
        dataPoints: dummyData
      }],
      backgroundColor: 'transparent'
    }).render();
  }

  renderTendenciaReparacionesChart() {
    // Implementar cuando el backend proporcione estos datos
    const dummyData = [
      { label: 'Ene', y: 20 }, { label: 'Feb', y: 25 },
      { label: 'Mar', y: 30 }, { label: 'Abr', y: 28 },
      { label: 'May', y: 35 }, { label: 'Jun', y: 40 }
    ];

    new CanvasJS.Chart('tendenciaReparaciones', {
      animationEnabled: true,
      theme: 'light2',
      title: {
        text: 'Tendencia de Reparaciones',
        fontSize: 16,
        padding: 10
      },
      axisY: {
        title: 'Cantidad',
        titleFontSize: 14
      },
      data: [{
        type: 'spline',
        color: this.chartColors.primary,
        dataPoints: dummyData
      }],
      backgroundColor: 'transparent'
    }).render();
  }

  changeYear(year: number) {
    this.selectedYear = year;
    this.renderAllCharts();
  }

  private mapDataToDataPoints(data: any[]): any[] {
    console.log('Mapeando datos:', data);
    if (!Array.isArray(data)) {
      console.error('Los datos no son un array:', data);
      return [];
    }

    if (data.length === 0) {
      console.log('Array de datos vacío');
      return [];
    }

    const dataPoints = data.map(item => {
      console.log('Procesando item:', item);
      // Si el item es un objeto con una propiedad y un valor
      if (typeof item === 'object' && item !== null) {
        const key = Object.keys(item)[0];
        const value = item[key];
        console.log(`Mapeando key: ${key}, value: ${value}`);
        if (value === null || value === undefined || isNaN(Number(value))) {
          console.warn(`Valor inválido para ${key}:`, value);
          return null;
        }
        return { 
          label: key, 
          y: typeof value === 'number' ? value : parseFloat(value) 
        };
      }
      // Si el item tiene una estructura específica para estadísticas
      else if (item.nombre && (item.cantidad || item.total || item.valor)) {
        const value = item.cantidad || item.total || item.valor;
        if (value === null || value === undefined || isNaN(Number(value))) {
          console.warn(`Valor inválido para ${item.nombre}:`, value);
          return null;
        }
        return {
          label: item.nombre,
          y: typeof value === 'number' ? value : parseFloat(value)
        };
      }
      // Si es un valor no reconocido
      else {
        console.warn('Formato de datos no reconocido:', item);
        return null;
      }
    }).filter(item => item !== null); // Eliminar items inválidos

    console.log('DataPoints procesados:', dataPoints);
    return dataPoints;
  }

  private showNoData(chartId: string): void {
    const chartElement = document.getElementById(chartId);
    const noDataElement = document.getElementById(`noData${chartId}`);
    
    if (chartElement) {
      chartElement.style.display = 'none';
    }
    if (noDataElement) {
      noDataElement.style.display = 'block';
    }
  }

  private hideNoData(chartId: string): void {
    const chartElement = document.getElementById(chartId);
    const noDataElement = document.getElementById(`noData${chartId}`);
    
    if (chartElement) {
      chartElement.style.display = 'block';
    }
    if (noDataElement) {
      noDataElement.style.display = 'none';
    }
  }

  private handleError(error: any): void {
    console.error('Error en la carga de datos:', error);
  }

  private renderChart(chartId: string, title: string, dataPoints: any[], type: string) {
    if (dataPoints && dataPoints.length > 0) {
      this.hideNoData(chartId);
      new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: 'light2',
        title: {
          text: title,
          fontSize: 20,
          padding: 10
        },
        axisX: {
          title: 'Mes',
          titleFontSize: 14,
          labelAngle: type === 'column' ? -45 : 0
        },
        axisY: {
          title: type === 'area' ? 'Monto ($)' : 'Cantidad',
          titleFontSize: 14,
          gridColor: '#f0f0f0',
          prefix: type === 'area' ? '$' : ''
        },
        data: [{
          type: type,
          color: this.chartColors.primary,
          fillOpacity: type === 'area' ? 0.3 : 1,
          dataPoints: dataPoints
        }],
        backgroundColor: 'transparent'
      }).render();
    } else {
      this.showNoData(chartId);
    }
  }

  private renderDoughnutChart(chartId: string, title: string, dataPoints: any[]) {
    if (dataPoints && dataPoints.length > 0) {
      this.hideNoData(chartId);
      new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: 'light2',
        title: {
          text: title,
          fontSize: 20,
          padding: 10
        },
        legend: {
          fontSize: 14,
          verticalAlign: 'center',
          horizontalAlign: 'right'
        },
        data: [{
          type: 'doughnut',
          startAngle: 60,
          innerRadius: '60%',
          indexLabelFontSize: 14,
          showInLegend: true,
          toolTipContent: '<b>{label}:</b> ${y} (#percent%)',
          dataPoints: dataPoints
        }],
        backgroundColor: 'transparent'
      }).render();
    } else {
      this.showNoData(chartId);
    }
  }

  private renderBarChart(chartId: string, title: string, dataPoints: any[]) {
    if (dataPoints && dataPoints.length > 0) {
      this.hideNoData(chartId);
      new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: 'light2',
        title: {
          text: title,
          fontSize: 20,
          padding: 10
        },
        axisX: {
          title: 'Técnico',
          titleFontSize: 14
        },
        axisY: {
          title: 'Reparaciones Completadas',
          titleFontSize: 14,
          gridColor: '#f0f0f0'
        },
        data: [{
          type: 'bar',
          color: this.chartColors.success,
          dataPoints: dataPoints
        }],
        backgroundColor: 'transparent'
      }).render();
    } else {
      this.showNoData(chartId);
    }
  }
}
