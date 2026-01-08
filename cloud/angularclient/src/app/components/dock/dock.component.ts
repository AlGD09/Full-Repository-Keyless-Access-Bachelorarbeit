import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface DockItem {
  icon: string;
  label: string;
  route?: string;
  onClick?: () => void;
}

@Component({
  selector: 'app-dock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dock.component.html'
})
export class DockComponent {
  @Input() dockItems: DockItem[] = [];
  hovered: string | null = null;

  constructor(private router: Router) {}

  handleClick(item: DockItem) {
      if (item.route) {
        this.router.navigate([item.route]);
      }
    }
}
