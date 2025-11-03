import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RcuService } from '../../services/rcu.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { Rcu } from '../../model/rcu';


@Component({
  selector: 'app-rcu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rcu.component.html',
  styleUrls: ['./rcu.component.scss']
})
export class RcuComponent {
  rcuId = '';
  name = '';
  location = '';
  message = '';

  rcus: Rcu[] = [];

  constructor(private rcuService: RcuService, private router: Router) {}

  ngOnInit(): void {
      this.loadRcus();
    }

  register(): void {
    if (!this.rcuId || !this.name) {
      this.message = 'Bitte ID und Name eingeben.';
      return;
    }

    const newRcu: Rcu = { rcuId: this.rcuId, name: this.name, location: this.location };
    this.rcuService.registerRcu(newRcu).subscribe({
      next: rcu => {
        this.message = 'Maschine erfolgreich registriert!';
        this.name = '';
        this.rcuId = '';
        this.location = '';
        // 🔹 Nach erfolgreicher Registrierung weiterleiten zur Zuweisungsseite
        this.router.navigate(['/maschine/assign'], { queryParams: { name: rcu.name, id: rcu.id } });
      },
      error: err => {
        this.message = err.error?.message || 'Fehler bei der Registrierung.';
      }
    });
  }
  loadRcus(): void {
    this.rcuService.getAllRcus().subscribe({
      next: (data: Rcu[]) => {
        this.rcus = data;


        this.rcus.forEach(rcu => {
          if (rcu.id) {
            this.rcuService.getAssignedSmartphone(rcu.rcuId).subscribe({
              next: (smartphone) => {
                rcu.smartphones = smartphone; //
              },
              error: () => {
                rcu.smartphones = undefined; // Kein Problem, wenn keine Zuordnung existiert
              }
            });
          }
        });
      },
      error: () => {
        this.message = 'Fehler beim Laden der RCUs.';
      }
    });
  }

  deleteRcu(id: number): void {
      if (confirm('Willst du diese RCU wirklich löschen?')) {
        this.rcuService.deleteRcu(id).subscribe({
          next: () => {
            this.loadRcus(); // Nach dem Löschen neu laden
          },
          error: () => {
            this.message = 'Fehler beim Löschen der RCU.';
          }
        });
      }
  }






}
