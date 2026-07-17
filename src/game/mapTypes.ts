export type MapLocation = 'prison' | 'swamps' | 'mines' | 'clock' | 'crypt' | 'bridge' | 'castle' | 'throne';

export type MapPlatform = { x: number; y: number; w: number; h: number; kind: 'solid' | 'oneWay' };
export type MapHazard = { x: number; y: number; w: number; h: number; kind: 'acid' | 'spikes' };
export type MapRoomBounds = { id: number; x: number; y: number; w: number; h: number };
export type ExploredMapArea = { x: number; y: number; radius: number };
export type LocationMapSnapshot = { location: MapLocation; worldWidth: number; worldHeight: number; rooms: MapRoomBounds[]; visitedRoomIds: number[]; exploredAreas?: ExploredMapArea[]; platforms: MapPlatform[]; hazards?: MapHazard[]; player?: { x: number; y: number } };
export type RunMapArchive = Partial<Record<MapLocation, LocationMapSnapshot>>;
