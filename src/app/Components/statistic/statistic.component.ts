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
  constructor(
    private shoppingService: ShoppingService,
    private repairsService: RepairsService
  ) {}

  ngOnInit(): void {
    this.renderReparacionesPorMesChart();
    this.renderGastosEnElAnoChart();
    this.renderComprasPorProveedorChart();
    this.renderReparacionesPorTecnicoChart();
  }

  renderReparacionesPorMesChart() {
    this.repairsService.getReparacionesPorMes(this.selectedYear).subscribe(
      (data) => {
        if (data.length === 0) {
          document.getElementById('reparacionesPorMes')!.style.display = 'none';
          document.getElementById('noDataReparacionesPorMes')!.style.display =
            'block';
        } else {
          document.getElementById('reparacionesPorMes')!.style.display =
            'block';
          document.getElementById('noDataReparacionesPorMes')!.style.display =
            'none';
          let dataPoints = data.map((item: { [x: string]: any }) => {
            let nombreMes = Object.keys(item)[0];
            let valor = item[nombreMes];
            return { label: nombreMes, y: valor };
          });

          let chart = new CanvasJS.Chart('reparacionesPorMes', {
            animationEnabled: true,
            theme: 'light2',
            title: {
              text: 'Reparaciones por mes',
              fontSize: 20,
              margin: 15,
            },
            axisY: {
              title: 'Cantidad de reparaciones',
            },
            data: [
              {
                type: 'column',
                dataPoints: dataPoints,
              },
            ],
            backgroundColor: 'transparent',
            borderThickness: 0,
            toolTip: {
              borderThickness: 0,
            },
          });
          chart.render();
        }
      },
      (error) => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  renderGastosEnElAnoChart() {
    this.shoppingService.getComprasPorMes(this.selectedYear).subscribe(
      (data) => {
        if (data.length === 0) {
          document.getElementById('gastosEnElAno')!.style.display = 'none';
          document.getElementById('noDataGastosEnElAno')!.style.display =
            'block';
        } else {
          document.getElementById('gastosEnElAno')!.style.display = 'block';
          document.getElementById('noDataGastosEnElAno')!.style.display =
            'none';
          let dataPoints = data.map((item: { [x: string]: any }) => {
            let nombreMes = Object.keys(item)[0];
            let valor = item[nombreMes];
            return { label: nombreMes, y: valor };
          });
          let chart = new CanvasJS.Chart('gastosEnElAno', {
            animationEnabled: true,
            theme: 'light2',
            title: {
              text: 'Gastos en el año',
              fontSize: 18,
              margin: 15,
            },
            axisY: {
              title: '',
            },
            data: [
              {
                type: 'line',
                dataPoints: dataPoints,
              },
            ],
            backgroundColor: 'transparent',
            borderThickness: 0,
            toolTip: {
              borderThickness: 0,
            },
          });
          chart.render();
        }
      },
      (error) => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  renderComprasPorProveedorChart() {
    this.shoppingService.getComprasPorProveedor(this.selectedYear).subscribe(
      (data) => {
        if (data.length === 0) {
          document.getElementById('comprasPorProveedor')!.style.display =
            'none';
          document.getElementById('noDataComprasPorProveedor')!.style.display =
            'block';
        } else {
          document.getElementById('comprasPorProveedor')!.style.display =
            'block';
          document.getElementById('noDataComprasPorProveedor')!.style.display =
            'none';
          let dataPoints = data.map((item: { [x: string]: any }) => {
            let nombreMes = Object.keys(item)[0];
            let valor = item[nombreMes];
            return { label: nombreMes, y: valor };
          });
          let chart = new CanvasJS.Chart('comprasPorProveedor', {
            animationEnabled: true,
            theme: 'light2',
            title: {
              text: 'Compras por proveedor',
              fontSize: 18,
              margin: 15,
            },
            data: [
              {
                type: 'doughnut',
                startAngle: 60,
                innerRadius: 60,
                indexLabelFontSize: 17,
                indexLabel: '{label} - #percent%',
                toolTipContent: '<b>{label}:</b> {y} (#percent%)',
                dataPoints: dataPoints,
              },
            ],
            backgroundColor: 'transparent',
            borderThickness: 0,
            toolTip: {
              borderThickness: 0,
            },
          });
          chart.render();
        }
      },
      (error) => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  renderReparacionesPorTecnicoChart() {
    this.repairsService.getReparacionesPorTecnico(this.selectedYear).subscribe(
      (data) => {
        if (data.length === 0) {
          document.getElementById('reparacionesPorTecnico')!.style.display =
            'none';
          document.getElementById(
            'noDataReparacionesPorTecnico'
          )!.style.display = 'block';
        } else {
          document.getElementById('reparacionesPorTecnico')!.style.display =
            'block';
          document.getElementById(
            'noDataReparacionesPorTecnico'
          )!.style.display = 'none';
          let dataPoints = data.map((item: { [x: string]: any }) => {
            let nombreMes = Object.keys(item)[0];
            let valor = item[nombreMes];
            return { label: nombreMes, y: valor };
          });
          let chart = new CanvasJS.Chart('reparacionesPorTecnico', {
            animationEnabled: true,
            theme: 'light2',
            title: {
              text: 'Reparaciones por técnico',
              fontSize: 18,
              margin: 15,
            },
            axisY: {
              title: '',
            },
            data: [
              {
                type: 'bar',
                dataPoints: dataPoints,
              },
            ],
            backgroundColor: 'transparent',
            borderThickness: 0,
            toolTip: {
              borderThickness: 0,
            },
          });
          chart.render();
        }
      },
      (error) => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  changeYear(year: number) {
    this.selectedYear = year;
    this.renderReparacionesPorMesChart();
    this.renderGastosEnElAnoChart();
    this.renderComprasPorProveedorChart();
    this.renderReparacionesPorTecnicoChart();
  }
}
