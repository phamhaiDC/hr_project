import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

/** Haversine formula → distance in metres between two GPS coordinates */
export function haversineMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearestResult {
  locationId: number;
  name: string;
  distanceM: number;
  withinRadius: boolean;
}

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.workLocation.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const loc = await this.prisma.workLocation.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException(`Location #${id} not found`);
    return loc;
  }

  create(dto: CreateLocationDto) {
    return this.prisma.workLocation.create({ data: dto });
  }

  async update(id: number, dto: Partial<CreateLocationDto>) {
    await this.findOne(id);
    return this.prisma.workLocation.update({ where: { id }, data: dto });
  }

  /**
   * Find the nearest work location to the given GPS coordinates.
   * Returns null if no locations are configured.
   */
  async findNearest(lat: number, lng: number): Promise<NearestResult | null> {
    const locations = await this.findAll();
    if (!locations.length) return null;

    let nearest: NearestResult | null = null;

    for (const loc of locations) {
      const distanceM = haversineMetres(lat, lng, loc.lat, loc.lng);
      if (!nearest || distanceM < nearest.distanceM) {
        nearest = {
          locationId: loc.id,
          name: loc.name,
          distanceM: Math.round(distanceM),
          withinRadius: distanceM <= loc.radius,
        };
      }
    }

    return nearest;
  }
}
