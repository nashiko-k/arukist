import type { WalkPhoto } from '../types/photo';
import type { SpotCluster, SpotLevel } from '../types/spot';

const CLUSTER_RADIUS_M = 50;

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * 111_000;
  const dLng = (lng2 - lng1) * 111_000 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function getSpotLevel(visitDays: number): SpotLevel {
  if (visitDays >= 60) return 5;
  if (visitDays >= 30) return 4;
  if (visitDays >= 10) return 3;
  if (visitDays >= 3) return 2;
  return 1;
}

export function clusterPhotos(photos: WalkPhoto[]): SpotCluster[] {
  const withGps = photos.filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  withGps.sort((a, b) => a.takenAt - b.takenAt);

  const clusters: SpotCluster[] = [];

  for (const photo of withGps) {
    let matched: SpotCluster | undefined;
    for (const cluster of clusters) {
      const d = distanceMeters(
        cluster.anchorPhoto.latitude!,
        cluster.anchorPhoto.longitude!,
        photo.latitude!,
        photo.longitude!,
      );
      if (d <= CLUSTER_RADIUS_M) {
        matched = cluster;
        break;
      }
    }

    if (matched) {
      matched.photos.push(photo);
    } else {
      clusters.push({
        id: photo.id,
        anchorPhoto: photo,
        photos: [photo],
        visitDays: 0,
        level: 1,
      });
    }
  }

  for (const cluster of clusters) {
    const days = new Set(
      cluster.photos.map((p) => {
        const d = new Date(p.takenAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    cluster.visitDays = days.size;
    cluster.level = getSpotLevel(days.size);
  }

  return clusters;
}
