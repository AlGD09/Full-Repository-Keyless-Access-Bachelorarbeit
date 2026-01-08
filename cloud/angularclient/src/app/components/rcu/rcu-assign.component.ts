import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RcuService } from '../../services/rcu.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { Smartphone } from '../../model/smartphone';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rcu-assign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rcu-assign.component.html',
  styleUrls: ['./rcu-assign.component.scss']
})
export class RcuAssignComponent implements OnInit {
  rcuId!: number;
  rcuName = '';
  smartphones: Smartphone[] = [];
  selectedSmartphoneIds: number[] = [];
  message = '';

  getAssigned: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rcuService: RcuService,
    private smartphoneService: SmartphoneService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.rcuId = +params['id'];
      this.rcuName = params['name'];
    });

    this.smartphoneService.getAll().subscribe({
      next: data => this.smartphones = data,
      error: () => this.message = 'Fehler beim Laden der Smartphones.'
    });
  }

  assign(): void {
    if (!this.selectedSmartphoneIds || this.selectedSmartphoneIds.length === 0) {
      this.getAssigned = false;
      const result = Swal.fire({
        text: `Bitte wählen Sie ein Smartphone aus`,
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
      return;
    }

    this.rcuService.assignSmartphones(this.rcuId, this.selectedSmartphoneIds).subscribe({
      next: _ => {
        this.message = 'Smartphone erfolgreich zugewiesen!'; this.getAssigned = true;
      },
      error: () => this.message = 'Zuweisung fehlgeschlagen.'
    });
  }

  getMachineImage(machineName: string): { src: string; height: string } {
    if (!machineName) return { src: 'maschine.png', height: 'h-21' };

    const name = machineName.toLowerCase();

    if (name.includes('bagger')) {
      return { src: 'bagger.png', height: 'h-40' };
    } else if (name.includes('kuka')) {
      return { src: 'kuka.png', height: 'h-30' };
    } else if (name.includes('walze')) {
      return { src: 'walze.png', height: 'h-40' };
    } else {
      return { src: 'maschine.png', height: 'h-21' };
    }
  }


   toggleSelection(id: number): void {
     const index = this.selectedSmartphoneIds.indexOf(id);
     if (index !== -1) {
       // bereits ausgewählt -> abwählen
       this.selectedSmartphoneIds.splice(index, 1);
     } else {
       // neu auswählen
       this.selectedSmartphoneIds.push(id);
     }
   }


   trackBySmartphoneId(index: number, item: any): number {
     return item.id;
   }






}
