import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonFab, IonFabButton,
  IonIcon, IonSpinner, IonSkeletonText,
  ModalController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, imageOutline, heartOutline, heart, trashOutline
} from 'ionicons/icons';
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
    IonIcon, IonSpinner, IonSkeletonText
  ]
})
export class Tab1Page implements OnInit {
  isTaking = false;

  constructor(
    public photoService: PhotoService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ cameraOutline, imageOutline, heartOutline, heart, trashOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadPhotos();
  }

  async takePhoto(): Promise<void> {
    this.isTaking = true;
    try {
      await this.photoService.takePhoto();
      await this.showToast('Photo enregistrée !', 'success');
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? '';
      if (
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('cancelled') ||
        msg.toLowerCase().includes('canceled')
      ) {
        await this.showToast(
          "Accès à la caméra refusé. Veuillez l'autoriser dans les paramètres de l'application.",
          'warning'
        );
      } else {
        await this.showToast('Impossible de prendre une photo.', 'danger');
      }
    } finally {
      this.isTaking = false;
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
    const result = await modal.onDidDismiss();
    if (result.data?.deleted) {
      await this.showToast('Photo supprimée.', 'success');
    }
  }

  async toggleLike(photo: UserPhoto, event: Event): Promise<void> {
    event.stopPropagation();
    await this.photoService.toggleLike(photo);
    const msg = photo.liked ? 'Photo ajoutée aux favoris !' : 'Favori retiré.';
    await this.showToast(msg, photo.liked ? 'success' : 'medium');
  }

  async confirmDelete(photo: UserPhoto, event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Supprimer la photo',
      message: 'Êtes-vous sûr de vouloir supprimer cette photo définitivement ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            await this.photoService.deletePhoto(photo);
            await this.showToast('Photo supprimée.', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
