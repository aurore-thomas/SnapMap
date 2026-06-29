import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonFab, IonFabButton,
  IonIcon, IonSpinner, ModalController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imageOutline } from 'ionicons/icons';
import { PhotoService } from '../core/services/photo';
import { UserPhoto } from '../core/models/user-photo.model';
import { PhotoDetailComponent } from '../features/photo-detail/photo-detail.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonFab, IonFabButton,
    IonIcon, IonSpinner
  ]
})
export class Tab1Page implements OnInit {
  isTaking = false;

  constructor(
    public photoService: PhotoService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({ cameraOutline, imageOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadPhotos();
  }

  async takePhoto(): Promise<void> {
    this.isTaking = true;
    const photo = await this.photoService.takePhoto();
    this.isTaking = false;

    if (!photo) {
      await this.showToast('Impossible de prendre une photo.', 'danger');
    }
  }

  async openDetail(photo: UserPhoto): Promise<void> {
    const index = this.photoService.photos.indexOf(photo);
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: {
        photos: this.photoService.photos,
        initialIndex: index >= 0 ? index : 0
      }
    });
    await modal.present();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2500, color });
    await toast.present();
  }
}
