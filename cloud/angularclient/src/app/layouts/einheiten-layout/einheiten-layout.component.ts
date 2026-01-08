import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarLayoutComponent } from '../../layouts/sidebar-layout/sidebar-layout.component';
import { EinheitenComponent } from '../../components/einheiten/einheiten.component';

@Component({
  selector: 'app-einheiten-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './einheiten-layout.component.html',
})
export class EinheitenLayoutComponent {}
