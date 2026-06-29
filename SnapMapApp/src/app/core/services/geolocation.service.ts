import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

// Position de secours utilisée si la géolocalisation est refusée ou indisponible
const FALLBACK_POSITION: GeoCoords = { latitude: 48.8566, longitude: 2.3522 };

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private lastKnownPosition: GeoCoords | null = null;
  private _permissionDenied = false;

  get permissionDenied(): boolean {
    return this._permissionDenied;
  }

  async getCurrentPosition(): Promise<GeoCoords> {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'denied') {
        this._permissionDenied = true;
        return this.lastKnownPosition ?? FALLBACK_POSITION;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      this._permissionDenied = false;
      this.lastKnownPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      return this.lastKnownPosition;
    } catch {
      this._permissionDenied = true;
      return this.lastKnownPosition ?? FALLBACK_POSITION;
    }
  }
}
