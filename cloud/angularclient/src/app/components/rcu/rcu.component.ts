import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RcuService } from '../../services/rcu.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { Rcu } from '../../model/rcu';
import { Smartphone } from '../../model/smartphone';
import Swal from 'sweetalert2';

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

  registered: boolean = false;
  exists: boolean = false;

  rcus: Rcu[] = [];

  constructor(private rcuService: RcuService, private router: Router) {}

  ngOnInit(): void {
      this.loadRcus();
    }

  register(): void {
    if (!this.rcuId || !this.name) {
      const result = Swal.fire({
        text: `Bitte Name und ID eingeben`,
        icon: 'warning',
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'OK',
        color: '#002B49', //Textfarbe
        buttonsStyling: false,
        customClass: {
          // actions: 'space-x-4 justify-center',
          cancelButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition focus:outline-none focus:ring-0'
        }
      });
      // alert('Bitte ID und Name eingeben.');
      return;
    }

    const newRcu: Rcu = { rcuId: this.rcuId, name: this.name, location: this.location };
    this.rcuService.registerRcu(newRcu).subscribe({
      next: async rcu => {
        this.registered = true;
        this.exists = false;
        this.name = '';
        this.rcuId = '';
        this.location = '';

        const result = await Swal.fire({
          text: `Möchten Sie ein Smartphone der Maschine ${rcu.name} zuordnen?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ja, zuweisen',
          cancelButtonText: 'Nein, später',
          color: '#002B49', //Textfarbe
          buttonsStyling: false, // <— deaktiviert Standard-Button-Styling
          customClass: {
            actions: 'space-x-4 justify-center',
            confirmButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
            cancelButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
          }
        });

        if (result.isConfirmed) {
          this.router.navigate(['/maschine/assign'], { queryParams: { name: rcu.name, id: rcu.id } });
        }
      },
      error: err => {
        this.exists = true; this.registered = false;
      }
    });
  }
  loadRcus(): void {
    this.rcuService.getAllRcus().subscribe({
      next: (data: Rcu[]) => {
        this.rcus = data;


        this.rcus.forEach(rcu => {
          if (rcu.id) {
            this.rcuService.getAssignedSmartphones(rcu.rcuId).subscribe({
              next: (smartphones: Smartphone[]) => {
                rcu.smartphones = smartphones ?? []; // asignar lista completa
              },
              error: () => {
                rcu.smartphones = []; // Kein Problem, wenn keine Zuordnung existiert
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
