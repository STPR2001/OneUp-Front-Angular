import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component'; 
import { ProvidersComponent } from './Components/providers/providers.component'; 

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'tecnicos', component: TecnicsComponent },
  { path: 'proveedores', component: ProvidersComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
