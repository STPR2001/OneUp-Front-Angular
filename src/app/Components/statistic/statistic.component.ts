import { Component, OnInit } from '@angular/core';
import { CanvasJS } from '@canvasjs/angular-charts';
import { RepairsService } from 'src/app/services/repairs.service';
import { ShoppingService } from 'src/app/services/shopping.service';


@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css']
})
export class StatisticComponent implements OnInit {

  constructor(private shoppingService: ShoppingService, private repairsService: RepairsService) { }

  ngOnInit(): void {
    this.renderReparacionesPorMesChart();
    this.renderGastosEnElAnoChart();
    this.renderComprasPorProveedorChart();
    this.renderReparacionesPorTecnicoChart();
  }

  renderReparacionesPorMesChart() {
    this.repairsService.getReparacionesPorMes().subscribe(
      data => {
        let dataPoints = data.map((item: { [x: string]: any; }) => {
          let nombreMes = Object.keys(item)[0];
          let valor = item[nombreMes];
          return { label: nombreMes, y: valor };
        });

        let chart = new CanvasJS.Chart("reparacionesPorMes", {
          animationEnabled: true,
          theme: "light2",
          title: {
            text: "Reparaciones por Mes"
          },
          axisY: {
            title: "Cantidad de Reparaciones"
          },
          data: [{
            type: "column",
            dataPoints: dataPoints
          }]
        });
        chart.render();
      },
      error => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  renderGastosEnElAnoChart() {
    this.shoppingService.getComprasPorMes().subscribe(
      data => {
        let dataPoints = data.map((item: { [x: string]: any; }) => {
          let nombreMes = Object.keys(item)[0];
          let valor = item[nombreMes];
          return { label: nombreMes, y: valor };
        });
        let chart = new CanvasJS.Chart("gastosEnElAno", {
          animationEnabled: true,
          theme: "light2",
          title: {
            text: "Gastos en el Año"
          },
          axisY: {
            title: "Monto en USD"
          },
          data: [{
            type: "line",
            dataPoints: dataPoints
          }]
        });
        chart.render();
      },
      error => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }

  renderComprasPorProveedorChart() {
    this.shoppingService.getComprasPorProveedor().subscribe(
      data => {
        let dataPoints = data.map((item: { [x: string]: any; }) => {
          let nombreMes = Object.keys(item)[0];
          let valor = item[nombreMes];
          return { label: nombreMes, y: valor };
        });
        let chart = new CanvasJS.Chart("comprasPorProveedor", {
          animationEnabled: true,
          theme: "light2",
          title: {
            text: "Compras por Proveedor"
          },
          data: [{
            type: "doughnut",
            startAngle: 60,
            innerRadius: 60,
            indexLabelFontSize: 17,
            indexLabel: "{label} - #percent%",
            toolTipContent: "<b>{label}:</b> {y} (#percent%)",
            dataPoints: dataPoints
          }]
        });
        chart.render();
      },
      error => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }
  renderReparacionesPorTecnicoChart() {
    this.repairsService.getReparacionesPorTecnico().subscribe(
      data => {
        let dataPoints = data.map((item: { [x: string]: any; }) => {
          let nombreMes = Object.keys(item)[0];
          let valor = item[nombreMes];
          return { label: nombreMes, y: valor };
        });
        let chart = new CanvasJS.Chart("reparacionesPorTecnico", {
          animationEnabled: true,
          theme: "light2",
          title: {
            text: "Reparaciones por Técnico"
          },
          axisY: {
            title: "Cantidad de Reparaciones"
          },
          data: [{
            type: "bar",
            dataPoints: dataPoints
          }]
        });
        chart.render();
      },
      error => {
        console.error('Error fetching reparaciones por mes:', error);
      }
    );
  }
}
