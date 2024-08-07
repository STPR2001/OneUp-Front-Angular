import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProvidersComponent } from './Components/providers/providers.component';
import { RepairsComponent } from './Components/repairs/repairs.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddRepairComponent } from './Components/repairs/add-repair/add-repair.component';
import { ModifyRepairComponent } from './Components/repairs/modify-repair/modify-repair.component'; //Implementar en formularios!
import { EquipmentsComponent } from './Components/equipments/equipments.component';
import { AuthGuard } from './services/auth/auth.guard';
import { LoginComponent } from './Components/login/login.component';
import { HomeComponent } from './Components/home/home.component';
import { ShoppingComponent } from './Components/shopping/shopping.component';
import { NewShoppingComponent } from './Components/shopping/new-shopping/new-shopping.component';
import { RepuestosComponent } from './Components/repuestos/repuestos.component';
import { ConfigComponent } from './Components/config/config.component';
import { StatisticComponent } from './Components/statistic/statistic.component';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { SeguimientoComponent } from './Components/seguimiento/seguimiento.component';
import { RestoreDataComponent } from './Components/restore-data/restore-data.component';

@NgModule({
  declarations: [
    AppComponent,
    ClientsComponent,
    TecnicsComponent,
    ProvidersComponent,
    RepairsComponent,
    AddRepairComponent,
    ModifyRepairComponent,
    EquipmentsComponent,
    LoginComponent,
    HomeComponent,
    ShoppingComponent,
    NewShoppingComponent,
    RepuestosComponent,
    ConfigComponent,
    StatisticComponent,
    SeguimientoComponent,
    RestoreDataComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    CanvasJSAngularChartsModule,
  ],
  providers: [AuthGuard],

  bootstrap: [AppComponent],
})
export class AppModule {}
