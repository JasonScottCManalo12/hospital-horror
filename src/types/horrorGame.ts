export type KeyId = 'nurse_key' | 'surgeon_key' | 'morgue_key' | 'master_key';

export interface KeyItem {
  id: KeyId;
  name: string;
  nameEn: string;
  color: string;
  description: string;
  descriptionEn: string;
  roomDestination: string;
  icon: string;
}

export type ItemType = 'key' | 'battery' | 'medkit' | 'note' | 'locker';

export interface WorldItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  keyId?: KeyId;
  noteId?: string;
  pickedUp?: boolean;
}

export interface LoreNote {
  id: string;
  title: string;
  titleEn: string;
  date: string;
  author: string;
  authorEn: string;
  content: string;
  contentEn: string;
}

export type GhostType = 'dolores' | 'patient73' | 'javier';

export type GhostState = 'patrol' | 'investigate' | 'chase' | 'attack';

export interface Ghost {
  id: string;
  type: GhostType;
  name: string;
  title: string;
  titleEn: string;
  x: number;
  y: number;
  angle: number;
  state: GhostState;
  speed: number;
  patrolTarget: { x: number; y: number } | null;
  lastKnownPlayerPos: { x: number; y: number } | null;
  investigateTimer: number;
  attackCooldown: number;
  screaming: boolean;
  distanceToPlayer: number;
}

export interface Player {
  x: number;
  y: number;
  angle: number; // in radians
  health: number; // 0 - 100
  sanity: number; // 0 - 100
  stamina: number; // 0 - 100
  isSprinting: boolean;
  flashlightOn: boolean;
  flashlightBattery: number; // 0 - 100
  isHiding: boolean;
  hidingLockerId: string | null;
  inventoryKeys: KeyId[];
  notesRead: string[];
}

export interface Door {
  x: number;
  y: number;
  isExit: boolean;
  requiredKey?: KeyId;
  isOpen: boolean;
  name: string;
  nameEn: string;
}

export interface HospitalMap {
  width: number;
  height: number;
  grid: number[][]; // 0: empty, 1: wall, 2: locked door, 3: exit door, 4: decorative bed/obstacle
  doors: Door[];
  items: WorldItem[];
  playerSpawn: { x: number; y: number; angle: number };
  ghostSpawns: Array<{ type: GhostType; x: number; y: number }>;
  roomLabels: Array<{ name: string; nameEn: string; x: number; y: number }>;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'hiding' | 'jumpscare' | 'gameover' | 'victory';
