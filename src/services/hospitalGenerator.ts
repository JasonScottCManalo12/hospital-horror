import { HospitalMap, KeyId, KeyItem, LoreNote, WorldItem, Door } from '../types/horrorGame';

export const KEY_DEFINITIONS: Record<KeyId, KeyItem> = {
  nurse_key: {
    id: 'nurse_key',
    name: 'Susi ng Punong Nars',
    nameEn: 'Head Nurse Key',
    color: '#38bdf8', // Cyan/blue
    description: 'Lumang tansong susi na may nakaukit na "WARD B - PSYCH". Binubuksan ang Psychiatric Isolation Ward.',
    descriptionEn: 'Old bronze key stamped with "WARD B - PSYCH". Unlocks the Psychiatric Isolation Ward.',
    roomDestination: 'Ward B (Psychiatric Isolation)',
    icon: 'KeyRound',
  },
  surgeon_key: {
    id: 'surgeon_key',
    name: 'Susi ng Silid Operasyon',
    nameEn: 'Surgical Ward Key',
    color: '#a855f7', // Purple
    description: 'Matalas na pilak na susi na may bahid ng kalawang. Binubuksan ang mga pinto ng Operating Theater.',
    descriptionEn: 'Sharp silver key with faint stains. Unlocks the Operating Theater doors.',
    roomDestination: 'Operating Theater (Surgery)',
    icon: 'Key',
  },
  morgue_key: {
    id: 'morgue_key',
    name: 'Malamig na Susi ng Morgue',
    nameEn: 'Morgue Freezer Key',
    color: '#f97316', // Amber/Orange
    description: 'Mabigat at nagyeyelong susi na bakal. Binubuksan ang mabigat na pintuan patungong Punebre at Cold Storage.',
    descriptionEn: 'Heavy icy iron key. Unlocks the heavy blast door into the Morgue and Cold Storage.',
    roomDestination: 'Morgue & Autopsy',
    icon: 'Skull',
  },
  master_key: {
    id: 'master_key',
    name: 'Pangunahing Master Key',
    nameEn: 'Grand Master Exit Key',
    color: '#eab308', // Gold
    description: 'Ang gintong susi ng San Lazaro. Ito lamang ang makakapagbukas ng nakakadenang Pangunahing Lagusan palabas ng ospital!',
    descriptionEn: 'The golden master key of San Lazaro. This is the only key that can open the chained Main Emergency Exit gate!',
    roomDestination: 'Pangunahing Lagusan (Emergency Exit)',
    icon: 'ShieldAlert',
  },
};

export const LORE_NOTES: Record<string, LoreNote> = {
  note_1: {
    id: 'note_1',
    title: 'Talaarawan ng Nars (Oktubre 1984)',
    titleEn: "Nurse's Diary (October 1984)",
    date: '12 Oktubre 1984',
    author: 'Nars Dolores Encarnacion',
    authorEn: 'Nurse Dolores Encarnacion',
    content: 'Hindi na tama ang ginagawa ni Dr. Javier sa Basement Ward. Naririnig ko ang sigaw ng mga pasyente gabi-gabi. Sinasabi niyang "paggamot" ito, ngunit bakit kailangang itali sa bakal ang kanilang mga leeg? Patayin ang ilaw kapag dumaan siya. Huwag mong titingnan ang kanyang mukha.',
    contentEn: "What Dr. Javier is doing in the Basement Ward is unholy. I hear the screams of patients every night. He calls it 'treatment', but why must their necks be bound in iron chains? Turn off your light when he passes. Never look into his face.",
  },
  note_2: {
    id: 'note_2',
    title: 'Medikal na Rekord: Pasyente 73',
    titleEn: 'Medical Record: Patient 73',
    date: '28 Nobyembre 1984',
    author: 'Talaan ng Psychiatric Ward',
    authorEn: 'Psychiatric Ward Registry',
    content: 'Ang Pasyente 73 ay tumangging tumayo. Gumagapang siya sa mga sahig at sumisigaw tuwing nakakakita ng liwanag. Naitalang nakalabas siya sa kanyang selda sa pamamagitan ng air vent. Babala sa lahat ng nars: Kapag narinig ang pagkaluskos sa sahig, huminto at magtago sa pinakamalapit na locker.',
    contentEn: 'Patient 73 refuses to stand upright. He crawls across the floor and shrieks when exposed to light. Reported missing from his cell via air vents. Warning to all staff: If you hear crawling sounds on the floor, halt and hide inside the nearest locker immediately.',
  },
  note_3: {
    id: 'note_3',
    title: 'Huling Liham ng Tagapamahala',
    titleEn: "Director's Final Dispatch",
    date: '14 Disyembre 1984',
    author: 'Direktor Roberto Santos',
    authorEn: 'Director Roberto Santos',
    content: 'Lahat ng lagusan ay aking ipinakadena. Hindi sila dapat makalabas sa San Lazaro. Ang Master Key ay dinala ng head doctor sa pinakailalim ng Morgue bago nagdilim ang buong pasilidad. Kung may makabasa man nito... nawa ay patawarin tayo ng Diyos.',
    contentEn: 'I have chained all the exits. They must never leave San Lazaro. The Master Key was taken by the head doctor down into the depths of the Morgue before the facility plunged into darkness. If anyone reads this... may God forgive us.',
  },
  note_4: {
    id: 'note_4',
    title: 'Lihim na Babala sa Dingding',
    titleEn: 'Scratched Wall Inscription',
    date: 'Hindi tiyak',
    author: 'Isang Nakaligtas',
    authorEn: 'A Survivor',
    content: 'ANG MGA MULTO AY NAAAKIT SA LIWANAG AT INGAY NG PAGTAKBO. Kapag narinig mo ang static sa radyo o bumilis ang tibok ng iyong puso, PATAYIN ANG FLASHLIGHT AT YUMUKO. Maghanap ng mga susi sa mga aparador at surgical tray.',
    contentEn: 'THE SPIRITS ARE DRAWN TO LIGHT AND RUNNING FOOTSTEPS. When you hear static on the radio or your heartbeat accelerates, TURN OFF THE FLASHLIGHT AND CROUCH. Search cabinets and surgical trays for keys.',
  },
};

/**
 * Procedural Hospital Map Generator
 * Generates an atmospheric 24x24 grid with rooms, interconnected corridors,
 * locked barrier doors, keys, hiding lockers, and items.
 */
export function generateHospitalMap(seed: number = Date.now()): HospitalMap {
  // Simple seeded pseudo-random generator
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const width = 24;
  const height = 24;

  // Grid values:
  // 0: Floor
  // 1: Wall (Hospital tiles/bricks)
  // 2: Locked Door
  // 3: Exit Door
  // 4: Obstacle (Overturned hospital bed / debris)
  const grid: number[][] = Array(height).fill(0).map(() => Array(width).fill(1));

  // Helper to carve open rooms
  const carveRect = (x: number, y: number, w: number, h: number) => {
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r > 0 && r < height - 1 && c > 0 && c < width - 1) {
          grid[r][c] = 0;
        }
      }
    }
  };

  const carveHCorridor = (x1: number, x2: number, y: number, widthSize: number = 1) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      for (let offset = 0; offset < widthSize; offset++) {
        if (y + offset > 0 && y + offset < height - 1 && x > 0 && x < width - 1) {
          grid[y + offset][x] = 0;
        }
      }
    }
  };

  const carveVCorridor = (y1: number, y2: number, x: number, widthSize: number = 1) => {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      for (let offset = 0; offset < widthSize; offset++) {
        if (y > 0 && y < height - 1 && x + offset > 0 && x + offset < width - 1) {
          grid[y][x + offset] = 0;
        }
      }
    }
  };

  // 1. Central Lobby & Corridors
  carveRect(9, 10, 6, 5); // Central Lobby (9..14, 10..14)
  carveHCorridor(2, 21, 12, 2); // Main East-West Corridor (Width 2)
  carveVCorridor(3, 21, 11, 2); // Main North-South Corridor (Width 2)

  // 2. West Wing (General Ward A: Patient Rooms 101, 102, 103, 104)
  carveRect(2, 3, 5, 4); // Ward 101
  carveRect(2, 8, 5, 3); // Ward 102
  carveRect(2, 15, 5, 3); // Ward 103
  carveRect(2, 19, 5, 3); // Nurse Archive 104

  // Connect West rooms to corridor
  grid[5][7] = 0;
  grid[9][7] = 0;
  grid[16][7] = 0;
  grid[20][7] = 0;
  carveVCorridor(4, 20, 7, 1); // West corridor connector

  // 3. East Wing (Psychiatric Isolation Ward B - Locked by Nurse Key)
  carveRect(17, 3, 5, 4); // Psych Cell 201
  carveRect(17, 8, 5, 3); // Psych Cell 202
  carveRect(17, 15, 5, 3); // Padded Cell 203
  carveRect(17, 19, 5, 4); // Seclusion Cell 204
  carveVCorridor(4, 20, 16, 1); // East corridor connector

  // Connect East rooms
  grid[5][16] = 0;
  grid[9][16] = 0;
  grid[16][16] = 0;
  grid[20][16] = 0;

  // 4. North Wing: Emergency Exit Lobby (North top)
  carveRect(9, 2, 6, 3); // Exit Ante-room

  // 5. South Wing: Operating Theater (South-West) & Morgue (South-East)
  carveRect(7, 18, 5, 4); // Surgical Operating Theater
  carveRect(13, 18, 5, 4); // Morgue & Cold Chambers

  // Add decorative obstacles / overturned gurneys
  grid[12][5] = 4;
  grid[13][18] = 4;
  grid[11][14] = 4;
  grid[7][11] = 4;
  grid[17][11] = 4;

  // Doors Configuration
  const doors: Door[] = [
    // Exit Door at North leading to freedom
    {
      x: 11,
      y: 2,
      isExit: true,
      requiredKey: 'master_key',
      isOpen: false,
      name: 'Pangunahing Lagusan (Emergency Exit)',
      nameEn: 'Main Emergency Exit',
    },
    // Door into East Wing (Psychiatric Ward) - needs Nurse Key
    {
      x: 15,
      y: 12,
      isExit: false,
      requiredKey: 'nurse_key',
      isOpen: false,
      name: 'Pintuan ng Ward B (Psychiatric Ward)',
      nameEn: 'Ward B Steel Gate (Psychiatric)',
    },
    // Door into Operating Theater - needs Surgeon Key
    {
      x: 9,
      y: 17,
      isExit: false,
      requiredKey: 'surgeon_key',
      isOpen: false,
      name: 'Pintuan ng Silid Operasyon',
      nameEn: 'Operating Theater Gate',
    },
    // Door into Morgue - needs Morgue Key
    {
      x: 14,
      y: 17,
      isExit: false,
      requiredKey: 'morgue_key',
      isOpen: false,
      name: 'Mabigat na Pinto ng Morgue & Cold Storage',
      nameEn: 'Blast Door of Morgue',
    },
  ];

  // Mark door tiles in grid
  doors.forEach((d) => {
    grid[d.y][d.x] = d.isExit ? 3 : 2;
  });

  // Items distribution with deterministic seed variation
  // 1. Nurse Key in West Ward (Ward 102 or Nurse Archive)
  const nurseKeyPos = random() > 0.5 ? { x: 4, y: 9 } : { x: 3, y: 20 };
  
  // 2. Surgeon Key in Psychiatric Ward (Cell 201 or Seclusion Cell 204)
  const surgeonKeyPos = random() > 0.5 ? { x: 19, y: 5 } : { x: 19, y: 21 };

  // 3. Morgue Key inside Operating Theater
  const morgueKeyPos = { x: 8, y: 20 };

  // 4. Master Key deep in the Morgue Cold Storage
  const masterKeyPos = { x: 15, y: 20 };

  const items: WorldItem[] = [
    // Keys
    { id: 'key_nurse', type: 'key', x: nurseKeyPos.x, y: nurseKeyPos.y, keyId: 'nurse_key' },
    { id: 'key_surgeon', type: 'key', x: surgeonKeyPos.x, y: surgeonKeyPos.y, keyId: 'surgeon_key' },
    { id: 'key_morgue', type: 'key', x: morgueKeyPos.x, y: morgueKeyPos.y, keyId: 'morgue_key' },
    { id: 'key_master', type: 'key', x: masterKeyPos.x, y: masterKeyPos.y, keyId: 'master_key' },

    // Batteries
    { id: 'bat_1', type: 'battery', x: 10, y: 11 }, // Central Lobby
    { id: 'bat_2', type: 'battery', x: 4, y: 4 },   // Ward 101
    { id: 'bat_3', type: 'battery', x: 19, y: 10 }, // Psych Ward
    { id: 'bat_4', type: 'battery', x: 10, y: 19 }, // Surgery ante-room
    { id: 'bat_5', type: 'battery', x: 14, y: 4 },  // North corridor

    // Sedatives / First Aid kits
    { id: 'med_1', type: 'medkit', x: 3, y: 16 },   // Ward 103
    { id: 'med_2', type: 'medkit', x: 18, y: 16 },  // Padded Cell
    { id: 'med_3', type: 'medkit', x: 10, y: 20 },  // Operating room

    // Lore notes
    { id: 'note_1', type: 'note', x: 12, y: 13, noteId: 'note_1' }, // Lobby reception desk
    { id: 'note_2', type: 'note', x: 4, y: 19, noteId: 'note_2' },  // Archive
    { id: 'note_3', type: 'note', x: 18, y: 4, noteId: 'note_3' },  // Psych office
    { id: 'note_4', type: 'note', x: 11, y: 4, noteId: 'note_4' },  // Near exit hallway

    // Hiding Lockers
    { id: 'locker_1', type: 'locker', x: 8, y: 12 },   // Central hall locker
    { id: 'locker_2', type: 'locker', x: 6, y: 7 },    // West wing corridor locker
    { id: 'locker_3', type: 'locker', x: 15, y: 8 },   // East wing locker
    { id: 'locker_4', type: 'locker', x: 11, y: 16 },  // South wing hallway locker
  ];

  // Room Labels for atmospheric display / minimap
  const roomLabels = [
    { name: 'Resepsyon at Lobby', nameEn: 'Lobby & Reception', x: 11, y: 12 },
    { name: 'Ward 101 (Kuwarto ng Pasyente)', nameEn: 'Ward 101', x: 4, y: 5 },
    { name: 'Ward 102', nameEn: 'Ward 102', x: 4, y: 9 },
    { name: 'Ward B (Psychiatric Isolation)', nameEn: 'Ward B (Psychiatric)', x: 19, y: 10 },
    { name: 'Silid Operasyon (Surgery)', nameEn: 'Operating Theater', x: 9, y: 20 },
    { name: 'Punebre at Morgue', nameEn: 'Morgue & Autopsy', x: 15, y: 20 },
    { name: 'Pangunahing Lagusan (Exit)', nameEn: 'Emergency Exit', x: 11, y: 3 },
  ];

  // Player Spawns in Central Lobby
  const playerSpawn = {
    x: 11.5,
    y: 12.5,
    angle: -Math.PI / 2, // Facing North towards corridors
  };

  // Ghost Spawns in strategic roaming areas
  const ghostSpawns = [
    { type: 'dolores' as const, x: 5.5, y: 6.5 },     // Dolores patrols West Ward
    { type: 'patient73' as const, x: 18.5, y: 16.5 }, // Patient 73 stalks East Wing
    { type: 'javier' as const, x: 11.5, y: 19.5 },    // Dr. Javier prowls South Corridor
  ];

  return {
    width,
    height,
    grid,
    doors,
    items,
    playerSpawn,
    ghostSpawns,
    roomLabels,
  };
}
