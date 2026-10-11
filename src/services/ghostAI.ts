import { Ghost, GhostType, HospitalMap, Player } from '../types/horrorGame';
import { horrorAudio } from './horrorAudio';

export const GHOST_PROFILES: Record<GhostType, {
  name: string;
  title: string;
  titleEn: string;
  baseSpeed: number;
  chaseSpeed: number;
  hearingSensitivity: number;
  sightDistance: number;
  color: string;
  lore: string;
}> = {
  dolores: {
    name: 'Dolores',
    title: 'Ang Naghihiganting Nars',
    titleEn: 'The Vengeful Head Nurse',
    baseSpeed: 1.2,
    chaseSpeed: 2.7,
    hearingSensitivity: 7.0,
    sightDistance: 10.0,
    color: '#e0f2fe',
    lore: 'Laging may bitbit na kalawanging hiringgilya. Maselan sa liwanag ng flashlight.',
  },
  patient73: {
    name: 'Pasyente 73',
    title: 'Ang Gumagapang na Multo',
    titleEn: 'The Crawling Spirit',
    baseSpeed: 1.0,
    chaseSpeed: 3.1,
    hearingSensitivity: 6.0,
    sightDistance: 8.0,
    color: '#f87171',
    lore: 'Gumagapang sa dilim. Biglang lumulundag kapag malapit na sa biktima.',
  },
  javier: {
    name: 'Doktor Javier',
    title: 'Ang Punong Siruhano',
    titleEn: 'The Mad Chief Surgeon',
    baseSpeed: 1.4,
    chaseSpeed: 2.5,
    hearingSensitivity: 12.0,
    sightDistance: 11.0,
    color: '#a78bfa',
    lore: 'Naririnig ang yabag ng pagtakbo kahit mula sa malayong pasilyo.',
  },
};

/**
 * Checks if there's direct line of sight between two points on the map grid
 */
export function hasLineOfSight(x1: number, y1: number, x2: number, y2: number, map: HospitalMap): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return true;

  const steps = Math.ceil(dist * 5); // 5 checks per unit distance
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 1; i < steps; i++) {
    const checkX = Math.floor(x1 + stepX * i);
    const checkY = Math.floor(y1 + stepY * i);

    if (checkX < 0 || checkX >= map.width || checkY < 0 || checkY >= map.height) {
      return false;
    }

    const tile = map.grid[checkY][checkX];
    // Walls or closed doors block line of sight
    if (tile === 1 || tile === 2 || tile === 3) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a tile is walkable for ghosts
 */
function isWalkable(x: number, y: number, map: HospitalMap): boolean {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gx >= map.width || gy < 0 || gy >= map.height) return false;
  const tile = map.grid[gy][gx];
  return tile === 0; // Empty floor
}

/**
 * Initializes ghosts at their configured spawn points
 */
export function createGhosts(map: HospitalMap): Ghost[] {
  return map.ghostSpawns.map((spawn, idx) => {
    const profile = GHOST_PROFILES[spawn.type];
    return {
      id: `ghost_${idx}_${spawn.type}`,
      type: spawn.type,
      name: profile.name,
      title: profile.title,
      titleEn: profile.titleEn,
      x: spawn.x,
      y: spawn.y,
      angle: Math.random() * Math.PI * 2,
      state: 'patrol',
      speed: profile.baseSpeed,
      patrolTarget: null,
      lastKnownPlayerPos: null,
      investigateTimer: 0,
      attackCooldown: 0,
      screaming: false,
      distanceToPlayer: 999,
    };
  });
}

/**
 * Updates Ghost AI state machine each frame
 */
export function updateGhost(
  ghost: Ghost,
  player: Player,
  map: HospitalMap,
  deltaTime: number
): { ghost: Ghost; attackedPlayer: boolean; triggeredScream: boolean } {
  let attackedPlayer = false;
  let triggeredScream = false;

  const profile = GHOST_PROFILES[ghost.type];
  const dx = player.x - ghost.x;
  const dy = player.y - ghost.y;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);
  ghost.distanceToPlayer = distToPlayer;

  // Reduce attack cooldown
  if (ghost.attackCooldown > 0) {
    ghost.attackCooldown -= deltaTime;
  }

  // Determine perception of player
  const canSee = !player.isHiding && hasLineOfSight(ghost.x, ghost.y, player.x, player.y, map);

  // Hearing check: sprinting makes loud footsteps
  let heardPlayer = false;
  if (!player.isHiding) {
    if (player.isSprinting && distToPlayer <= profile.hearingSensitivity) {
      heardPlayer = true;
    } else if (distToPlayer <= profile.hearingSensitivity * 0.45) {
      // Normal walking or close proximity
      heardPlayer = true;
    }
  }

  // Sight check: Flashlight makes player visible from far away
  let spottedBySight = false;
  if (canSee) {
    if (player.flashlightOn && distToPlayer <= profile.sightDistance) {
      spottedBySight = true;
    } else if (!player.flashlightOn && distToPlayer <= profile.sightDistance * 0.4) {
      // In dark, ghost only spots player if very close
      spottedBySight = true;
    }
  }

  // State Transitions
  if ((spottedBySight || heardPlayer) && !player.isHiding) {
    if (ghost.state !== 'chase') {
      triggeredScream = true;
      ghost.screaming = true;
      horrorAudio.playGhostScream();
    }
    ghost.state = 'chase';
    ghost.lastKnownPlayerPos = { x: player.x, y: player.y };
    ghost.speed = profile.chaseSpeed;
  } else if (ghost.state === 'chase') {
    // If player hid in locker or broke line of sight
    if (player.isHiding || !canSee) {
      // Head to last known position and investigate
      ghost.state = 'investigate';
      ghost.investigateTimer = 4.0; // Investigate for 4 seconds
      ghost.speed = profile.baseSpeed * 1.1;
    }
  }

  // Execute State Behavior
  if (ghost.state === 'chase' && ghost.lastKnownPlayerPos) {
    const targetX = ghost.lastKnownPlayerPos.x;
    const targetY = ghost.lastKnownPlayerPos.y;
    const moveAngle = Math.atan2(targetY - ghost.y, targetX - ghost.x);
    ghost.angle = moveAngle;

    // Move towards player
    const moveDist = ghost.speed * deltaTime;
    const nextX = ghost.x + Math.cos(moveAngle) * moveDist;
    const nextY = ghost.y + Math.sin(moveAngle) * moveDist;

    // Simple collision slide
    if (isWalkable(nextX, ghost.y, map)) ghost.x = nextX;
    if (isWalkable(ghost.x, nextY, map)) ghost.y = nextY;

    // Check attack reach
    if (distToPlayer < 0.85 && ghost.attackCooldown <= 0 && !player.isHiding) {
      attackedPlayer = true;
      ghost.attackCooldown = 1.8;
      horrorAudio.playJumpscareSting();
    }
  } else if (ghost.state === 'investigate') {
    ghost.investigateTimer -= deltaTime;
    if (ghost.lastKnownPlayerPos) {
      const targetX = ghost.lastKnownPlayerPos.x;
      const targetY = ghost.lastKnownPlayerPos.y;
      const moveAngle = Math.atan2(targetY - ghost.y, targetX - ghost.x);
      ghost.angle = moveAngle;

      const moveDist = ghost.speed * deltaTime;
      const nextX = ghost.x + Math.cos(moveAngle) * moveDist;
      const nextY = ghost.y + Math.sin(moveAngle) * moveDist;

      if (isWalkable(nextX, ghost.y, map)) ghost.x = nextX;
      if (isWalkable(ghost.x, nextY, map)) ghost.y = nextY;
    }

    if (ghost.investigateTimer <= 0) {
      ghost.state = 'patrol';
      ghost.speed = profile.baseSpeed;
      ghost.patrolTarget = null;
      ghost.screaming = false;
    }
  } else {
    // Patrol mode: wander corridors
    if (!ghost.patrolTarget || Math.hypot(ghost.patrolTarget.x - ghost.x, ghost.patrolTarget.y - ghost.y) < 0.6) {
      // Pick random walkable neighbor tile
      const angle = Math.random() * Math.PI * 2;
      const testDist = 2 + Math.random() * 4;
      const testX = ghost.x + Math.cos(angle) * testDist;
      const testY = ghost.y + Math.sin(angle) * testDist;
      if (isWalkable(testX, testY, map)) {
        ghost.patrolTarget = { x: testX, y: testY };
      }
    }

    if (ghost.patrolTarget) {
      const moveAngle = Math.atan2(ghost.patrolTarget.y - ghost.y, ghost.patrolTarget.x - ghost.x);
      ghost.angle = moveAngle;
      const moveDist = ghost.speed * deltaTime;
      const nextX = ghost.x + Math.cos(moveAngle) * moveDist;
      const nextY = ghost.y + Math.sin(moveAngle) * moveDist;

      let moved = false;
      if (isWalkable(nextX, ghost.y, map)) {
        ghost.x = nextX;
        moved = true;
      }
      if (isWalkable(ghost.x, nextY, map)) {
        ghost.y = nextY;
        moved = true;
      }

      // If blocked, pick new target
      if (!moved) {
        ghost.patrolTarget = null;
      }
    }
  }

  return { ghost, attackedPlayer, triggeredScream };
}
