import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { EinheitenLayoutComponent } from '../../layouts/einheiten-layout/einheiten-layout.component';

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-layout.component.html',
})
export class SidebarLayoutComponent {
  openSection: string | null = null;
  isExpanded = false;

  constructor(private router: Router) {
    // beobachte Router und öffne entsprechendes Untermenü automatisch
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;

        if (url.startsWith('/user') || url.startsWith('/smartphone') || url.startsWith('/maschine')) {
          this.openSection = 'registrierung';
        } else if (url.startsWith('/einheiten') || url.startsWith('/zuweisungen')) {
          this.openSection = 'system';
        } else {
          this.openSection = null;
        }
      });
  }

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? null : section;
  }
}
