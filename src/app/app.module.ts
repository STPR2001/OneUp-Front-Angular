import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './Components/sidebar/sidebar.component';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProvidersComponent } from './Components/providers/providers.component';
import { RepairsComponent } from './Components/repairs/repairs.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddRepairComponent } from './Components/repairs/add-repair/add-repair.component';
import { ModifyRepairComponent } from './Components/repairs/modify-repair/modify-repair.component'; //Implementar en formularios!
import { EquipmentsComponent } from './Components/equipments/equipments.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    ClientsComponent,
    TecnicsComponent,
    ProvidersComponent,
    RepairsComponent,
    AddRepairComponent,
    ModifyRepairComponent,
    EquipmentsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
