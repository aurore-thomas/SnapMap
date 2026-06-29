import { Injectable, NgZone } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { UserPhoto } from '../models/user-photo.model';
import { GeoCoords } from './geolocation.service';

export interface PhotoCluster {
  photos: UserPhoto[];
  center: GeoCoords;
}

// Rayon de regroupement (~111m par 0.001 degré)
const CLUSTER_RADIUS_DEG = 0.001;

// Décalages pour l'animation de séparation (split)
const SPLIT_OFFSETS: GeoCoords[] = [
  { latitude: 0.0012, longitude: 0 },
  { latitude: -0.0012, longitude: 0 },
  { latitude: 0, longitude: 0.0012 },
  { latitude: 0, longitude: -0.0012 },
  { latitude: 0.0008, longitude: 0.0008 }
];

@Injectable({ providedIn: 'root' })
export class MapService {
  private map?: mapboxgl.Map;
  private clusterMarkers: mapboxgl.Marker[] = [];
  private splitMarkers: mapboxgl.Marker[] = [];

  constructor(private ngZone: NgZone) {}

  initializeMap(container: HTMLElement, center: GeoCoords): mapboxgl.Map {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.longitude, center.latitude],
      zoom: 13
    });

    // Marqueur de position utilisateur
    const userMarkerEl = document.createElement('div');
    userMarkerEl.className = 'user-location-marker';
    new mapboxgl.Marker({ element: userMarkerEl, anchor: 'center' })
      .setLngLat([center.longitude, center.latitude])
      .addTo(this.map);

    return this.map;
  }

  getMap(): mapboxgl.Map | undefined {
    return this.map;
  }

  clearMarkers(): void {
    this.clusterMarkers.forEach(m => m.remove());
    this.clusterMarkers = [];
    this.clearSplitMarkers();
  }

  clearSplitMarkers(): void {
    this.splitMarkers.forEach(m => m.remove());
    this.splitMarkers = [];
  }

  addPhotoMarkers(
    photos: UserPhoto[],
    onPhotoClick: (photo: UserPhoto, allPhotos: UserPhoto[]) => void,
    onClusterClick: (clusterPhotos: UserPhoto[]) => void
  ): void {
    if (!this.map || photos.length === 0) return;
    this.clearMarkers();

    const clusters = this.buildClusters(photos);

    clusters.forEach(cluster => {
      if (cluster.photos.length === 1) {
        this.addSingleMarker(cluster.photos[0], photos, onPhotoClick);
      } else {
        this.addClusterMarker(cluster, photos, onPhotoClick, onClusterClick);
      }
    });
  }

  private buildClusters(photos: UserPhoto[]): PhotoCluster[] {
    const assigned = new Set<number>();
    const clusters: PhotoCluster[] = [];

    for (let i = 0; i < photos.length; i++) {
      if (assigned.has(i)) continue;

      const group: UserPhoto[] = [photos[i]];
      assigned.add(i);

      for (let j = i + 1; j < photos.length; j++) {
        if (assigned.has(j)) continue;
        const dLat = photos[i].latitude - photos[j].latitude;
        const dLng = photos[i].longitude - photos[j].longitude;
        if (Math.sqrt(dLat * dLat + dLng * dLng) < CLUSTER_RADIUS_DEG) {
          group.push(photos[j]);
          assigned.add(j);
        }
      }

      const center: GeoCoords =
        group.length === 1
          ? { latitude: group[0].latitude, longitude: group[0].longitude }
          : {
              latitude: group.reduce((s, p) => s + p.latitude, 0) / group.length,
              longitude: group.reduce((s, p) => s + p.longitude, 0) / group.length
            };

      clusters.push({ photos: group, center });
    }

    return clusters;
  }

  private addSingleMarker(
    photo: UserPhoto,
    allPhotos: UserPhoto[],
    onPhotoClick: (photo: UserPhoto, allPhotos: UserPhoto[]) => void
  ): void {
    const el = this.createMarkerElement(photo.webviewPath, 0);
    el.addEventListener('click', () => this.ngZone.run(() => onPhotoClick(photo, allPhotos)));

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([photo.longitude, photo.latitude])
      .addTo(this.map!);
    this.clusterMarkers.push(marker);
  }

  private addClusterMarker(
    cluster: PhotoCluster,
    allPhotos: UserPhoto[],
    onPhotoClick: (photo: UserPhoto, allPhotos: UserPhoto[]) => void,
    onClusterClick: (clusterPhotos: UserPhoto[]) => void
  ): void {
    const el = this.createMarkerElement(cluster.photos[0].webviewPath, cluster.photos.length);

    el.addEventListener('click', () => {
      this.ngZone.run(() => {
        this.clearSplitMarkers();
        if (cluster.photos.length <= 5) {
          this.splitCluster(cluster, allPhotos, onPhotoClick);
        } else {
          onClusterClick(cluster.photos);
        }
      });
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([cluster.center.longitude, cluster.center.latitude])
      .addTo(this.map!);
    this.clusterMarkers.push(marker);
  }

  private splitCluster(
    cluster: PhotoCluster,
    allPhotos: UserPhoto[],
    onPhotoClick: (photo: UserPhoto, allPhotos: UserPhoto[]) => void
  ): void {
    cluster.photos.forEach((photo, i) => {
      const offset = SPLIT_OFFSETS[i % SPLIT_OFFSETS.length];
      const el = this.createMarkerElement(photo.webviewPath, 0);
      el.classList.add('split-marker');
      el.addEventListener('click', () => this.ngZone.run(() => onPhotoClick(photo, allPhotos)));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cluster.center.longitude + offset.longitude, cluster.center.latitude + offset.latitude])
        .addTo(this.map!);
      this.splitMarkers.push(marker);
    });
  }

  private createMarkerElement(webviewPath: string, count: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'photo-marker';

    const img = document.createElement('img');
    img.src = webviewPath;
    img.alt = '';
    container.appendChild(img);

    if (count > 1) {
      const badge = document.createElement('span');
      badge.className = 'photo-marker-badge';
      badge.textContent = count > 99 ? '99+' : String(count);
      container.appendChild(badge);
    }

    return container;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const token = environment.mapboxToken;
    if (!token || token === 'YOUR_MAPBOX_PUBLIC_TOKEN') {
      return 'Adresse non disponible';
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&language=fr&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      return (data.features?.[0]?.place_name as string) ?? 'Adresse inconnue';
    } catch {
      return 'Adresse inconnue';
    }
  }
}
