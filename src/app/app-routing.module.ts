import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component'; 
import { ProvidersComponent } from './Components/providers/providers.component'; 
import { LoginComponent } from './Components/login/login.component';
import { AuthGuard } from './services/auth/auth.guard';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard]},
  { path: 'tecnicos', component: TecnicsComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProvidersComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
