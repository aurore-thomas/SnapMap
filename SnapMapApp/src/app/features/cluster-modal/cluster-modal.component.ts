import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonGrid, IonRow, IonCol, IonIcon, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { UserPhoto } from '../../core/models/user-photo.model';
import { PhotoDetailComponent } from '../photo-detail/photo-detail.component';

@Component({
  selector: 'app-cluster-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonGrid, IonRow, IonCol, IonIcon
  ],
  templateUrl: './cluster-modal.component.html',
  styleUrls: ['./cluster-modal.component.scss']
})
export class ClusterModalComponent {
  @Input() photos: UserPhoto[] = [];

  constructor(private modalController: ModalController) {
    addIcons({ closeOutline });
  }

  async openPhotoDetail(index: number): Promise<void> {
    const detailModal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: {
        photos: this.photos,
        initialIndex: index
      }
    });
    await detailModal.present();
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
