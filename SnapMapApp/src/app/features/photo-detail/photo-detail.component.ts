import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonContent,
  IonIcon, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, chevronBackOutline, chevronForwardOutline, locationOutline, calendarOutline } from 'ionicons/icons';
import { UserPhoto } from '../../core/models/user-photo.model';
import { MapService } from '../../core/services/map.service';

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

  constructor(
    private modalController: ModalController,
    private mapService: MapService
  ) {
    addIcons({ closeOutline, chevronBackOutline, chevronForwardOutline, locationOutline, calendarOutline });
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

  async loadAddress(): Promise<void> {
    this.isLoadingAddress = true;
    this.address = await this.mapService.reverseGeocode(
      this.currentPhoto.latitude,
      this.currentPhoto.longitude
    );
    this.isLoadingAddress = false;
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
