export interface UserPhoto {
  webviewPath: string;
  filePath: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  address?: string;
  liked?: boolean;
}
