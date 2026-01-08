import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { User } from '../../model/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-smartphone-assign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smartphone-assign.component.html'
})
export class SmartphoneAssignComponent implements OnInit {
 users: User[] = [];
 selectedUserIds: number[] = [];
 smartphoneId!: number;
 smartphoneName = '';
 message = '';

 getAssigned: boolean = false;

 constructor(
     private route: ActivatedRoute,
     private router: Router,
     private userService: UserService,
     private smartphoneService: SmartphoneService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.smartphoneId = +params['id'];
      this.smartphoneName = params['name'];
    });

    this.userService.getAllUsers().subscribe({
      next: data => this.users = data,
      error: () => this.message = 'Fehler beim Laden der Smartphones.'
    });
  }

  assign(): void {
    if (!this.selectedUserIds || this.selectedUserIds.length === 0) {
      this.getAssigned = false;
      const result = Swal.fire({
        text: `Bitte wählen Sie einen Benutzer aus`,
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

    this.smartphoneService.assignUsers(this.smartphoneId, this.selectedUserIds).subscribe({
      next: _ => {
        this.message = 'Users erfolgreich zugewiesen!'; this.getAssigned = true;
      },
      error: () => this.message = 'Zuweisung fehlgeschlagen.'
    });
  }

  getSmartphoneImage(smartphoneName: string): { src: string; height: string } {
    if (!smartphoneName) return { src: 'phone.png', height: 'h-21' };

    const name = smartphoneName.toLowerCase();

    if (name.includes('iphone')) {
      return { src: 'apple.png', height: 'h-40' };
    } else if (name.includes('samsung')) {
      return { src: 'samsung.png', height: 'h-40' };
    } else if (name.includes('xiaomi')) {
      return { src: 'mi.png', height: 'h-40' };
    } else {
      return { src: 'phone.png', height: 'h-44' };
    }
  }

  toggleSelection(id: number): void {
     const index = this.selectedUserIds.indexOf(id);
     if (index !== -1) {
       // bereits ausgewählt -> abwählen
       this.selectedUserIds.splice(index, 1);
     } else {
       // neu auswählen
       this.selectedUserIds.push(id);
     }
  }


  trackByUserId(index: number, item: any): number {
     return item.id;
  }



}
