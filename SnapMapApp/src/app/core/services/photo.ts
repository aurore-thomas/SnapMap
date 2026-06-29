import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { UserPhoto } from '../models/user-photo.model';
import { GeolocationService } from './geolocation.service';

const STORAGE_KEY = 'snapmap_photos';

type StoredPhoto = Omit<UserPhoto, 'webviewPath'>;

@Injectable({ providedIn: 'root' })
export class PhotoService {
  photos: UserPhoto[] = [];

  constructor(private geolocationService: GeolocationService) {}

  async loadPhotos(): Promise<void> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    const stored: StoredPhoto[] = value ? JSON.parse(value) : [];

    this.photos = await Promise.all(
      stored.map(async (p) => {
        try {
          const file = await Filesystem.readFile({
            path: p.filePath,
            directory: Directory.Data
          });
          return {
            ...p,
            webviewPath: `data:image/jpeg;base64,${file.data as string}`
          };
        } catch {
          return { ...p, webviewPath: '' };
        }
      })
    );

    this.photos = this.photos.filter(p => p.webviewPath !== '');
  }

  async takePhoto(): Promise<UserPhoto> {
    const captured = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
      allowEditing: false
    });

    const coords = await this.geolocationService.getCurrentPosition();

    const base64Data = await this.readAsBase64(captured);
    const fileName = `photo_${Date.now()}.jpeg`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    const photo: UserPhoto = {
      webviewPath: `data:image/jpeg;base64,${base64Data}`,
      filePath: fileName,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: Date.now(),
      liked: false
    };

    this.photos.unshift(photo);
    await this.savePhotos();
    return photo;
  }

  async deletePhoto(photo: UserPhoto): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: photo.filePath,
        directory: Directory.Data
      });
    } catch { /* fichier déjà absent */ }

    this.photos = this.photos.filter(p => p.timestamp !== photo.timestamp);
    await this.savePhotos();
  }

  async toggleLike(photo: UserPhoto): Promise<void> {
    photo.liked = !photo.liked;
    await this.savePhotos();
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.readFile({ path: photo.path! });
      return file.data as string;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const data = reader.result as string;
          resolve(data.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    }
  }

  private async savePhotos(): Promise<void> {
    const toStore: StoredPhoto[] = this.photos.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ webviewPath, ...rest }) => rest
    );
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(toStore) });
  }
}
