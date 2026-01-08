import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartphoneService } from '../../../services/smartphone.service';
import { Smartphone } from '../../../model/smartphone';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-einheiten-smartphones',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './einheiten-smartphones.component.html'
})
export class EinheitenSmartphonesComponent {
    // Smartphones
    smartphones: Smartphone[] = [];

    // Status
    loading = false;
    errorMsg = '';

  constructor(
    private smartphoneService: SmartphoneService,
    private router: Router
  ) {
    this.loadData();
  }

  // Lädt beide Tabellen gleichzeitig
  loadData(): void {
    this.loading = true;

    // Smartphones abrufen
    this.smartphoneService.getAll().subscribe({
      next: (data: Smartphone[]) => {
        this.smartphones = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = err.message || 'Fehler beim Laden der Smartphones';
        this.loading = false;
      }
    });
  }

  deleteSmartphone(id: number): void {
    Swal.fire({
      text: `Möchten Sie wirklich dieses Smartphone löschen?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ja',
      cancelButtonText: 'Nein',
      color: '#002B49',
      buttonsStyling: false,
      customClass: {
        actions: 'space-x-4 justify-center',
        confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
        cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.smartphoneService.deleteSmartphone(id).subscribe({
          next: () => this.loadData(),
          error: () => this.errorMsg = 'Fehler beim Löschen des Smartphones.'
        });
      }
    });
  }

  handleClick(s: Smartphone) {
      if (s.status === 'gesperrt') {
          this.UnblockSmartphone(s.name, s.deviceId);
        } else {
          this.BlockSmartphone(s.name, s.deviceId);
        }

    }

    BlockSmartphone(name: string, deviceId: string) {
      Swal.fire({
        text: `Möchten Sie ${name} sperren?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ja',
        cancelButtonText: 'Nein',
        color: '#002B49',
        buttonsStyling: false,
        customClass: {
          actions: 'space-x-4 justify-center',
          confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
          cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
        }
      }).then(result => {
        if (result.isConfirmed) {
          this.smartphoneService.blockSmartphone(deviceId).subscribe({
            next: () => this.loadData()
          });
        }
      });
    }

    UnblockSmartphone(name: string, deviceId: string) {
      Swal.fire({
        text: `Smartphone ${name} ist blockiert. Möchten Sie es entsperren?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ja',
        cancelButtonText: 'Nein',
        color: '#002B49',
        buttonsStyling: false,
        customClass: {
          actions: 'space-x-4 justify-center',
          confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
          cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
        }
      }).then(result => {
        if (result.isConfirmed) {
          this.smartphoneService.unblockSmartphone(deviceId).subscribe({
            next: () => this.loadData()
          });
        }
      });
    }

  getSmartphoneImage(smartphoneName: string): { src: string; height: string } {
    if (!smartphoneName) return { src: 'phone.png', height: 'h-28' };

    const name = smartphoneName.toLowerCase();

    if (name.includes('iphone')) {
      return { src: 'apple.png', height: 'h-28' };
    } else if (name.includes('samsung')) {
      return { src: 'samsung.png', height: 'h-28' };
    } else if (name.includes('xiaomi')) {
      return { src: 'mi.png', height: 'h-28' };
    } else {
      return { src: 'phone.png', height: 'h-28' };
    }
  }





}
