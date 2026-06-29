import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
    const stored = (value ? JSON.parse(value) : []) as UserPhoto[];
    const loaded: UserPhoto[] = [];

    for (const photo of stored) {
      try {
        const file = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        // On remplace le webviewPath (qui était peut-être un blob expiré) par le base64
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        loaded.push(photo);
      } catch (e) {
        // Fichier manquant, on ignore
      }
    }
    this.photos = loaded;
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
      const savedPhotoFile = await this.savePhoto(captured);

      const photo: UserPhoto = {
        filepath: savedPhotoFile.filepath,
        webviewPath: savedPhotoFile.webviewPath,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now()
      };

      this.photos.unshift(photo);
      await this.savePhotos();
      return photo;
    } catch (e) {
      console.error('Erreur takePhoto', e);
      return null;
    }
  }

  private async savePhoto(photo: Photo): Promise<{ filepath: string; webviewPath: string }> {
    const base64Data = await this.readAsBase64(photo);
    const fileName = new Date().getTime() + '.jpeg';

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    return {
      filepath: fileName,
      webviewPath: base64Data,
    };
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  async deletePhoto(photo: UserPhoto): Promise<void> {
    this.photos = this.photos.filter(p => p.timestamp !== photo.timestamp);
    await Filesystem.deleteFile({
      path: photo.filepath,
      directory: Directory.Data
    });
    await this.savePhotos();
  }

  private async savePhotos(): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.photos) });
  }
}
