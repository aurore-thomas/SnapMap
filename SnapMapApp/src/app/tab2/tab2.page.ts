import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSpinner, IonIcon, IonFab, IonFabButton,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, warningOutline } from 'ionicons/icons';
import { GeolocationService } from '../core/services/geolocation.service';
import { MapService } from '../core/services/map.service';
import { PhotoService } from '../core/services/photo';
import { UserPhoto } from '../core/models/user-photo.model';
import { PhotoDetailComponent } from '../features/photo-detail/photo-detail.component';
import { ClusterModalComponent } from '../features/cluster-modal/cluster-modal.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSpinner, IonIcon, IonFab, IonFabButton
  ]
})
export class Tab2Page implements AfterViewInit, OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLElement>;

  isLoading = true;
  geoError = false;

  constructor(
    private geolocationService: GeolocationService,
    private mapService: MapService,
    private photoService: PhotoService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({ refreshOutline, warningOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadPhotos();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  async initMap(): Promise<void> {
    this.isLoading = true;
    this.geoError = false;

    const coords = await this.geolocationService.getCurrentPosition();

    if (this.geolocationService.permissionDenied) {
      this.geoError = true;
      await this.showGeoErrorToast();
    }

    const map = this.mapService.initializeMap(this.mapContainer.nativeElement, coords);

    map.on('load', () => {
      this.isLoading = false;
      this.addMarkersToMap();
    });

    // Fermer les markers éclatés si on clique ailleurs sur la carte
    map.on('click', () => this.mapService.clearSplitMarkers());
  }

  private addMarkersToMap(): void {
    this.mapService.addPhotoMarkers(
      this.photoService.photos,
      (photo, allPhotos) => this.openPhotoDetail(photo, allPhotos),
      (clusterPhotos) => this.openClusterModal(clusterPhotos)
    );
  }

  async refreshMap(): Promise<void> {
    await this.photoService.loadPhotos();
    this.addMarkersToMap();
  }

  async openPhotoDetail(photo: UserPhoto, allPhotos: UserPhoto[]): Promise<void> {
    const index = allPhotos.indexOf(photo);
    const modal = await this.modalController.create({
      component: PhotoDetailComponent,
      componentProps: {
        photos: allPhotos,
        initialIndex: index >= 0 ? index : 0
      }
    });
    await modal.present();
  }

  async openClusterModal(clusterPhotos: UserPhoto[]): Promise<void> {
    const modal = await this.modalController.create({
      component: ClusterModalComponent,
      componentProps: { photos: clusterPhotos }
    });
    await modal.present();
  }

  private async showGeoErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Géolocalisation refusée. La carte affiche une position par défaut (Paris).',
      duration: 4000,
      color: 'warning',
      icon: 'warning-outline',
      position: 'bottom'
    });
    await toast.present();
  }
}
