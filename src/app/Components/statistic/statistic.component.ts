import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CanvasJS } from '@canvasjs/angular-charts';
import { RepairsService } from 'src/app/services/repairs.service';
import { ShoppingService } from 'src/app/services/shopping.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css'],
})
export class StatisticComponent implements OnInit, OnDestroy {
  selectedYear: number = new Date().getFullYear();
  reparaciones: any[] = [];
  allReparaciones: any[] = []; // Para estadísticas completas
  
  // Configuración de gráficos
  chartColors = [
    '#7c3aed', '#a855f7', '#c084fc', '#e879f9', '#f3e8ff',
    '#4f46e5', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
    '#ec4899', '#f472b6', '#fb7185', '#fda4af', '#fecaca'
  ];

  // Estados de carga y error
  ingresosTecnicoLoading = false;
  ingresosTecnicoError: string | null = null;
  anios: number[] = [];

  // Filtros y vista
  vistaSeleccionada: string = 'todos';
  periodoSeleccionado: string = 'mensual';
  
  // Tipos de gráficos (para toggle)
  chartTypes: { [key: string]: string } = {
    'reparacionesMes': 'line',
    'tecnicosRendimiento': 'column',
    'ingresosMes': 'area',
    'ingresosTecnico': 'bar'
  };

  // Para búsqueda y filtros con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Objetivos y metas
  objetivoMensualIngresos: number = 5000000; // $5,000,000 COP
  tiempoIdealReparacion: number = 5; // 5 días

  constructor(
    private shoppingService: ShoppingService,
    private repairsService: RepairsService
  ) {}

  ngOnInit(): void {
    // Carga diferida mínima: solo reparaciones del año para gráficos principales
    this.cargarReparaciones();
    this.initAnios();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  cargarReparaciones() {
    // Usar endpoint optimizado por año cuando esté disponible; fallback a /all
    this.repairsService.getReparaciones(0, 500).subscribe(
      (page) => {
        const list = (page && page.content) ? page.content : (Array.isArray(page) ? page : []);
        this.reparaciones = list.filter((r: any) => new Date(r.fechaIngreso).getFullYear() === this.selectedYear);
        this.renderAllCharts();
      },
      (error) => { console.error('Error al cargar reparaciones:', error); }
    );
  }

  getAllReparacionesForStats(): void {}

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
    
    const reparacionesEntregadas = this.reparaciones.filter(r => {
      if (r.activo === false) return false;
      if (r.estado !== 'Entregada') return false;
      if (!r.fechaEntrega) return false;
      
      const fechaEntrega = new Date(r.fechaEntrega);
      const mesEntrega = fechaEntrega.getMonth();
      const anioEntrega = fechaEntrega.getFullYear();
      
      return mesEntrega === mesActual && anioEntrega === anioActual;
    });
    
    return reparacionesEntregadas.reduce((total, r) => {
      return total + (r.manoDeObra || 0) + (r.entrega || 0);
    }, 0);
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

  // Métodos de utilidad nuevos
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor || 0);
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Nuevos métodos para estadísticas avanzadas
  getProgresoIngresos(): number {
    const ingresosActuales = this.getEstadisticasGenerales().ingresosMensuales;
    return Math.min(Math.round((ingresosActuales / this.objetivoMensualIngresos) * 100), 100);
  }

  getEficienciaOperacional(): number {
    const tiempoPromedio = this.getEstadisticasGenerales().promedioTiempoReparacion;
    if (tiempoPromedio === 0) return 100;
    
    const eficiencia = Math.max(0, 100 - ((tiempoPromedio - this.tiempoIdealReparacion) * 10));
    return Math.round(eficiencia);
  }

  getFidelizacionPorcentaje(): number {
    const totalClientes = new Set(this.reparaciones.filter(r => r.activo).map(r => r.cliente.id)).size;
    const clientesRecurrentes = this.getEstadisticasGenerales().clientesRecurrentes;
    
    if (totalClientes === 0) return 0;
    return Math.round((clientesRecurrentes / totalClientes) * 100);
  }

  getTrendIcon(tipo: string): string {
    switch (tipo) {
      case 'tiempo':
        const tiempo = this.getEstadisticasGenerales().promedioTiempoReparacion;
        return tiempo <= this.tiempoIdealReparacion ? 'trending_down' : 'trending_up';
      default:
        return 'trending_flat';
    }
  }

  getTrendClass(tipo: string): string {
    switch (tipo) {
      case 'tiempo':
        const tiempo = this.getEstadisticasGenerales().promedioTiempoReparacion;
        return tiempo <= this.tiempoIdealReparacion ? 'trend-positive' : 'trend-negative';
      default:
        return 'trend-neutral';
    }
  }

  getTrendText(tipo: string): string {
    switch (tipo) {
      case 'tiempo':
        const tiempo = this.getEstadisticasGenerales().promedioTiempoReparacion;
        return tiempo <= this.tiempoIdealReparacion ? 'Excelente tiempo' : 'Mejorar tiempo';
      default:
        return 'Sin cambios';
    }
  }

  // Métodos para filtros y vista
  onVistaChange(): void {
    setTimeout(() => {
      this.renderAllCharts();
    }, 100);
  }

  onPeriodoChange(): void {
    this.renderAllCharts();
  }

  // Métodos para gestión de gráficos
  getChartTypeIcon(chartKey: string): string {
    const type = this.chartTypes[chartKey] || 'line';
    switch (type) {
      case 'line': return 'show_chart';
      case 'column': return 'bar_chart';
      case 'area': return 'area_chart';
      case 'bar': return 'bar_chart';
      default: return 'show_chart';
    }
  }

  toggleChartType(chartKey: string): void {
    const currentType = this.chartTypes[chartKey];
    const types = ['line', 'column', 'area', 'bar'];
    const currentIndex = types.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % types.length;
    this.chartTypes[chartKey] = types[nextIndex];
    
    setTimeout(() => {
      this.renderAllCharts();
    }, 100);
  }

  downloadChart(chartKey: string): void {
    // Implementar descarga de gráfico
    console.log('Descargando gráfico:', chartKey);
  }

  // Método para insights y recomendaciones
  getInsights(): any[] {
    const stats = this.getEstadisticasGenerales();
    const insights: any[] = [];

    // Insight sobre reparaciones urgentes
    if (stats.reparacionesUrgentes > 0) {
      insights.push({
        type: 'warning',
        icon: 'warning',
        title: 'Reparaciones Urgentes Detectadas',
        description: `Hay ${stats.reparacionesUrgentes} reparaciones que llevan más de 7 días en taller. Se recomienda priorizar su finalización.`,
        action: 'ver_urgentes',
        actionText: 'Ver reparaciones urgentes'
      });
    }

    // Insight sobre eficiencia
    const eficiencia = this.getEficienciaOperacional();
    if (eficiencia < 70) {
      insights.push({
        type: 'improvement',
        icon: 'speed',
        title: 'Oportunidad de Mejora en Eficiencia',
        description: `La eficiencia operacional está en ${eficiencia}%. Se recomienda optimizar los procesos de reparación.`,
        action: 'optimizar_procesos',
        actionText: 'Ver estrategias'
      });
    }

    // Insight sobre ingresos
    const progreso = this.getProgresoIngresos();
    if (progreso >= 100) {
      insights.push({
        type: 'success',
        icon: 'celebration',
        title: '¡Objetivo Mensual Alcanzado!',
        description: `Has superado el objetivo mensual de ingresos en un ${progreso}%. ¡Excelente trabajo!`,
        action: null,
        actionText: null
      });
    } else if (progreso < 50) {
      insights.push({
        type: 'attention',
        icon: 'trending_up',
        title: 'Aumentar Ingresos del Mes',
        description: `Estás al ${progreso}% del objetivo mensual. Considera estrategias para incrementar las reparaciones completadas.`,
        action: 'estrategias_ingresos',
        actionText: 'Ver estrategias'
      });
    }

    // Insight sobre fidelización
    const fidelizacion = this.getFidelizacionPorcentaje();
    if (fidelizacion > 40) {
      insights.push({
        type: 'success',
        icon: 'favorite',
        title: 'Excelente Fidelización de Clientes',
        description: `El ${fidelizacion}% de tus clientes son recurrentes. Esto indica una alta satisfacción con el servicio.`,
        action: null,
        actionText: null
      });
    }

    return insights;
  }

  ejecutarAccion(accion: string): void {
    switch (accion) {
      case 'ver_urgentes':
        this.verReparacionesUrgentes();
        break;
      case 'optimizar_procesos':
        console.log('Mostrar estrategias de optimización');
        break;
      case 'estrategias_ingresos':
        console.log('Mostrar estrategias para aumentar ingresos');
        break;
      default:
        console.log('Acción no implementada:', accion);
    }
  }

  // Métodos para modal de reparaciones urgentes
  verReparacionesUrgentes(): void {
    const modalElement = document.getElementById('urgentesModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getReparacionesUrgentesDetalle(): any[] {
    return this.reparaciones.filter(r => 
      r.activo && r.estado === 'En taller' && this.getDiasEnTaller(r) > 7
    );
  }

  cerrarModal(): void {
    // Método para cerrar modales
  }

  // Métodos de exportación y actualización
  exportarEstadisticas(): void {
    const stats = this.getEstadisticasGenerales();
    const csvHeaders = [
      'Métrica', 'Valor', 'Año', 'Fecha Exportación'
    ];
    
    const csvData = [
      ['Total Reparaciones', stats.totalReparaciones, this.selectedYear, new Date().toLocaleDateString()],
      ['En Taller', this.getReparacionesEnTaller(), this.selectedYear, new Date().toLocaleDateString()],
      ['Finalizadas', this.getReparacionesFinalizadas(), this.selectedYear, new Date().toLocaleDateString()],
      ['Entregadas', this.getReparacionesEntregadas(), this.selectedYear, new Date().toLocaleDateString()],
      ['Reparaciones Urgentes', stats.reparacionesUrgentes, this.selectedYear, new Date().toLocaleDateString()],
      ['Ingresos Mensuales (COP)', stats.ingresosMensuales, this.selectedYear, new Date().toLocaleDateString()],
      ['Tiempo Promedio (días)', stats.promedioTiempoReparacion, this.selectedYear, new Date().toLocaleDateString()],
      ['Clientes Recurrentes', stats.clientesRecurrentes, this.selectedYear, new Date().toLocaleDateString()],
      ['Técnico Más Productivo', stats.tecnicoMasProductivo, this.selectedYear, new Date().toLocaleDateString()],
      ['Eficiencia Operacional (%)', this.getEficienciaOperacional(), this.selectedYear, new Date().toLocaleDateString()]
    ];

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estadisticas_${this.selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void { this.cargarReparaciones(); }

  // Métodos de gráficos existentes (mantenidos)
  renderAllCharts(): void {
    this.renderReparacionesPorMesChart();
    this.renderComprasPorProveedorChart();
    this.renderReparacionesPorTecnicoChart();
    this.renderIngresosPorTecnicoCanvas();
  }

  renderReparacionesPorMesChart() {
    // Consumir backend agregado por año para minimizar datos transferidos
    this.repairsService.getReparacionesPorMes(this.selectedYear).subscribe({
      next: (rows: any[]) => {
        const mapMes: { [k: number]: string } = {1:'ene',2:'feb',3:'mar',4:'abr',5:'may',6:'jun',7:'jul',8:'ago',9:'sep',10:'oct',11:'nov',12:'dic'};
        const dataPoints = (rows || []).map(r => ({ label: mapMes[r.mes] || String(r.mes), y: r.cantidad || 0 }));
        if (dataPoints.length === 0) { this.showNoData('noDataReparacionesPorMes'); return; }
        this.hideNoData('noDataReparacionesPorMes');
        this.renderChart('reparacionesPorMes', 'Reparaciones por Mes', dataPoints, this.chartTypes['reparacionesMes'] || 'line');
      },
      error: () => this.showNoData('noDataReparacionesPorMes')
    });
  }

  renderComprasPorProveedorChart() {
    // Usar endpoint optimizado ingresos-por-mes
    this.repairsService.getIngresosPorMes(this.selectedYear).subscribe({
      next: (rows: any[]) => {
        const mapMes: { [k: number]: string } = {1:'ene',2:'feb',3:'mar',4:'abr',5:'may',6:'jun',7:'jul',8:'ago',9:'sep',10:'oct',11:'nov',12:'dic'};
        const dataPoints = (rows || []).map(r => ({ label: mapMes[r.mes] || String(r.mes), y: r.monto || 0 }));
        if (dataPoints.length === 0) { this.showNoData('noDataComprasPorProveedor'); return; }
        this.hideNoData('noDataComprasPorProveedor');
        this.renderChart('comprasPorProveedor', 'Ingresos por Mes', dataPoints, this.chartTypes['ingresosMes'] || 'area');
      },
      error: () => this.showNoData('noDataComprasPorProveedor')
    });
  }

  renderReparacionesPorTecnicoChart() {
    const reparacionesPorTecnico = this.reparaciones
      .filter(r => r.activo && r.tecnico)
      .reduce((acc: { [key: string]: number }, r) => {
        acc[r.tecnico.nombre] = (acc[r.tecnico.nombre] || 0) + 1;
        return acc;
      }, {});

    const dataPoints = Object.entries(reparacionesPorTecnico)
      .map(([tecnico, cantidad]) => ({ label: tecnico, y: cantidad }));

    if (dataPoints.length === 0) {
      this.showNoData('noDataReparacionesPorTecnico');
      return;
    }

    this.hideNoData('noDataReparacionesPorTecnico');
    this.renderChart('reparacionesPorTecnico', 'Reparaciones por Técnico', dataPoints, this.chartTypes['tecnicosRendimiento'] || 'column');
  }

  changeYear(year: number) {
    this.selectedYear = year;
    this.cargarReparaciones();
    this.renderIngresosPorTecnicoCanvas();
  }

  private mapDataToDataPoints(data: any[]): any[] {
    return data.map((item, index) => ({
      label: item.label || `Item ${index + 1}`,
      y: item.y || item.value || 0,
      color: this.chartColors[index % this.chartColors.length]
    }));
  }

  private showNoData(chartId: string): void {
    const noDataElement = document.getElementById(chartId);
    if (noDataElement) {
      noDataElement.style.display = 'flex';
    }
  }

  private hideNoData(chartId: string): void {
    const noDataElement = document.getElementById(chartId);
    if (noDataElement) {
      noDataElement.style.display = 'none';
    }
  }

  private handleError(error: any): void {
    console.error('Error en gráfico:', error);
  }

  private renderChart(chartId: string, title: string, dataPoints: any[], type: string) {
    try {
      const chart = new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: "light2",
        title: {
          text: title,
          fontSize: 16,
          fontFamily: "Arial",
          fontColor: "#2c3e50"
        },
        backgroundColor: "transparent",
        data: [{
          type: type,
          color: this.chartColors[0],
          lineColor: this.chartColors[0],
          markerColor: this.chartColors[0],
          dataPoints: this.mapDataToDataPoints(dataPoints)
        }],
        axisX: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6"
        },
        axisY: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6",
          gridColor: "#f8f9fa"
        }
      });
      chart.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  private renderDoughnutChart(chartId: string, title: string, dataPoints: any[]) {
    try {
      const chart = new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: "light2",
        title: {
          text: title,
          fontSize: 16,
          fontFamily: "Arial",
          fontColor: "#2c3e50"
        },
        backgroundColor: "transparent",
        data: [{
          type: "doughnut",
          startAngle: 60,
          innerRadius: 60,
          indexLabelFontSize: 12,
          indexLabel: "{label} - #percent%",
          toolTipContent: "<b>{label}:</b> {y} (#percent%)",
          dataPoints: this.mapDataToDataPoints(dataPoints)
        }]
      });
      chart.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  private renderBarChart(chartId: string, title: string, dataPoints: any[]) {
    try {
      const chart = new CanvasJS.Chart(chartId, {
        animationEnabled: true,
        theme: "light2",
        title: {
          text: title,
          fontSize: 16,
          fontFamily: "Arial",
          fontColor: "#2c3e50"
        },
        backgroundColor: "transparent",
        data: [{
          type: "bar",
          color: this.chartColors[0],
          dataPoints: this.mapDataToDataPoints(dataPoints)
        }],
        axisX: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6"
        },
        axisY: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6",
          gridColor: "#f8f9fa"
        }
      });
      chart.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  initAnios() {
    for (let year = 2017; year <= new Date().getFullYear() + 1; year++) {
      this.anios.push(year);
    }
  }

  onYearChangeIngresosTecnico() {
    this.renderIngresosPorTecnicoCanvas();
  }

  renderIngresosPorTecnicoCanvas() {
    this.ingresosTecnicoLoading = true;
    this.ingresosTecnicoError = null;

    try {
      // Asegurar que el contenedor exista (por cambios de vista/ngIf)
      const container = document.getElementById('ingresosPorTecnicoCanvas');
      if (!container) {
        setTimeout(() => this.renderIngresosPorTecnicoCanvas(), 100);
        return;
      }

      const ingresosPorTecnico = this.reparaciones
        .filter(r => r.activo && r.estado === 'Entregada' && r.fechaEntrega && r.tecnico &&
          new Date(r.fechaEntrega).getFullYear() === this.selectedYear)
        .reduce((acc: { [key: string]: number }, r) => {
          const ingresos = Number(r.manoDeObra || 0) + Number(r.entrega || 0);
          acc[r.tecnico.nombre] = (acc[r.tecnico.nombre] || 0) + ingresos;
          return acc;
        }, {});

      const dataPoints = Object.entries(ingresosPorTecnico)
        .map(([tecnico, ingresos]) => ({ 
          label: tecnico, 
          y: ingresos 
        }));

      if (dataPoints.length === 0) {
        this.showNoData('noDataIngresosPorTecnicoCanvas');
        this.ingresosTecnicoLoading = false;
        return;
      }

      this.hideNoData('noDataIngresosPorTecnicoCanvas');
      
      const chart = new CanvasJS.Chart("ingresosPorTecnicoCanvas", {
        animationEnabled: true,
        theme: "light2",
        title: {
          text: `Ingresos por Técnico - ${this.selectedYear}`,
          fontSize: 16,
          fontFamily: "Arial",
          fontColor: "#2c3e50"
        },
        backgroundColor: "transparent",
        data: [{
          type: this.chartTypes['ingresosTecnico'] || "column",
          color: this.chartColors[1],
          dataPoints: this.mapDataToDataPoints(dataPoints)
        }],
        axisX: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6"
        },
        axisY: {
          labelFontColor: "#6c757d",
          lineColor: "#dee2e6",
          tickColor: "#dee2e6",
          gridColor: "#f8f9fa",
          prefix: "$"
        }
      });
      
      chart.render();
      this.ingresosTecnicoLoading = false;
    } catch (error) {
      console.error('Error al renderizar gráfico de ingresos por técnico:', error);
      this.ingresosTecnicoError = 'Error al cargar los datos del gráfico';
      this.ingresosTecnicoLoading = false;
    }
  }
}
