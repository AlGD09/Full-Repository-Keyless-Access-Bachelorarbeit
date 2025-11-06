import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgClass],
  templateUrl: './home-layout.component.html',
})
export class HomeLayoutComponent {
  regOpen = false;
  sysOpen = false;

  toggleReg(event: MouseEvent) {
    event.stopPropagation();
    this.regOpen = !this.regOpen;
    this.sysOpen = false;
  }

  toggleSys(event: MouseEvent) {
    event.stopPropagation();
    this.sysOpen = !this.sysOpen;
    this.regOpen = false;
  }

  closeAll() {
    this.regOpen = false;
    this.sysOpen = false;
  }

  // Klick außerhalb schließt Dropdowns
  @HostListener('document:click')
  onClickOutside() {
    this.closeAll();
  }
}
