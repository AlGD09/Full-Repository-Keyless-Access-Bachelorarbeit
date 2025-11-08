import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SmartphoneComponent } from './components/smartphone/smartphone.component';
import { SmartphoneAssignComponent } from './components/smartphone/smartphone-assign.component';
import { RcuComponent } from './components/rcu/rcu.component';
import { UserComponent } from './components/user/user.component';
import { RcuAssignComponent } from './components/rcu/rcu-assign.component';
import { HomeComponent } from './components/home/home.component';
import { EinheitenComponent } from './components/einheiten/einheiten.component';
import { ZuweisungenComponent } from './components/zuweisungen/zuweisungen.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout.component';
import { EinheitenLayoutComponent } from './layouts/einheiten-layout/einheiten-layout.component';
import { EinheitenSmartphonesComponent } from './components/einheiten/smartphones/einheiten-smartphones.component';
import { EinheitenMaschinenComponent } from './components/einheiten/maschinen/einheiten-maschinen.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    component: SidebarLayoutComponent,
    children: [
      { path: 'user', component: UserComponent },
      { path: 'smartphone', component: SmartphoneComponent },
      { path: 'smartphone/assign', component: SmartphoneAssignComponent },
      { path: 'maschine', component: RcuComponent},
      { path: 'maschine/assign', component: RcuAssignComponent},
      { path: 'einheiten', component: EinheitenLayoutComponent,
        children: [
          { path: '', component: EinheitenComponent },
          { path: 'smartphones', component: EinheitenSmartphonesComponent },
          { path: 'maschinen', component: EinheitenMaschinenComponent },
        ],
      },
      { path: 'zuweisungen', component: ZuweisungenComponent}
    ],
  },
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
export class AppRoutingModule { }
