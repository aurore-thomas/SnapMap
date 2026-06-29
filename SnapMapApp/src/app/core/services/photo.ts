import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { UserPhoto } from '../models/user-photo.model';
import { GeolocationService } from './geolocation.service';

const STORAGE_KEY = 'snapmap_photos';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  photos: UserPhoto[] = [];

  constructor(private geolocationService: GeolocationService) {}

  async loadPhotos(): Promise<void> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    this.photos = value ? JSON.parse(value) : [];
  }

  async takePhoto(): Promise<UserPhoto | null> {
    try {
      const captured = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false
      });

      const coords = await this.geolocationService.getCurrentPosition();

      const photo: UserPhoto = {
        webviewPath: captured.webPath ?? '',
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now()
      };

      this.photos.unshift(photo);
      await this.savePhotos();
      return photo;
    } catch {
      return null;
    }
  }

  async deletePhoto(photo: UserPhoto): Promise<void> {
    this.photos = this.photos.filter(p => p.timestamp !== photo.timestamp);
    await this.savePhotos();
  }

  private async savePhotos(): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.photos) });
  }
}
