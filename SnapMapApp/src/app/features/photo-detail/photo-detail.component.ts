import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonContent,
  IonIcon, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, chevronBackOutline, chevronForwardOutline,
  locationOutline, calendarOutline, trashOutline, heartOutline, heart
} from 'ionicons/icons';
import { UserPhoto } from '../../core/models/user-photo.model';
import { MapService } from '../../core/services/map.service';
import { PhotoService } from '../../core/services/photo';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonContent,
    IonIcon, IonSpinner
  ],
  templateUrl: './photo-detail.component.html',
  styleUrls: ['./photo-detail.component.scss']
})
export class PhotoDetailComponent implements OnInit {
  @Input() photos: UserPhoto[] = [];
  @Input() initialIndex = 0;

  currentIndex = 0;
  address = '';
  isLoadingAddress = true;

  private touchStartX = 0;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private mapService: MapService,
    private photoService: PhotoService
  ) {
    addIcons({
      closeOutline, chevronBackOutline, chevronForwardOutline,
      locationOutline, calendarOutline, trashOutline, heartOutline, heart
    });
  }

  get currentPhoto(): UserPhoto {
    return this.photos[this.currentIndex];
  }

  get hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  get hasNext(): boolean {
    return this.currentIndex < this.photos.length - 1;
  }

  async ngOnInit(): Promise<void> {
    this.currentIndex = this.initialIndex;
    await this.loadAddress();
  }

  async previous(): Promise<void> {
    if (this.hasPrevious) {
      this.currentIndex--;
      await this.loadAddress();
    }
  }

  async next(): Promise<void> {
    if (this.hasNext) {
      this.currentIndex++;
      await this.loadAddress();
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  async onTouchEnd(event: TouchEvent): Promise<void> {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) await this.previous();
      else await this.next();
    }
  }

  async loadAddress(): Promise<void> {
    this.isLoadingAddress = true;
    this.address = await this.mapService.reverseGeocode(
      this.currentPhoto.latitude,
      this.currentPhoto.longitude
    );
    this.isLoadingAddress = false;
  }

  async toggleLike(): Promise<void> {
    await this.photoService.toggleLike(this.currentPhoto);
  }

  async confirmDelete(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Supprimer la photo',
      message: 'Êtes-vous sûr de vouloir supprimer cette photo définitivement ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            await this.photoService.deletePhoto(this.currentPhoto);
            this.modalController.dismiss({ deleted: true });
          }
        }
      ]
    });
    await alert.present();
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
