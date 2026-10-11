import React, { useEffect, useRef, useState } from 'react';
import { Door, Ghost, HospitalMap, Player, WorldItem } from '../types/horrorGame';
import { KEY_DEFINITIONS } from '../services/hospitalGenerator';
import vengefulSpiritImgSrc from '../assets/images/vengeful_spirit_1791720067076.jpg';

interface HorrorViewportProps {
  player: Player;
  ghosts: Ghost[];
  map: HospitalMap;
  closestInteractable: { type: 'item' | 'door'; obj: WorldItem | Door; dist: number } | null;
  onInteract: () => void;
  isJumpscare: boolean;
  activeJumpscareGhost: Ghost | null;
}

export const HorrorViewport: React.FC<HorrorViewportProps> = ({
  player,
  ghosts,
  map,
  closestInteractable,
  isJumpscare,
  activeJumpscareGhost,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Thunder flash state
  const lightningRef = useRef<{ active: boolean; brightness: number }>({ active: false, brightness: 0 });

  // Load ghost image asset
  useEffect(() => {
    const img = new Image();
    img.src = vengefulSpiritImgSrc;
    img.onload = () => {
      ghostImageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  // Periodic random thunder / flickering fluorescent light effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.25) {
        lightningRef.current = { active: true, brightness: 0.85 };
        setTimeout(() => {
          lightningRef.current = { active: true, brightness: 0.4 };
          setTimeout(() => {
            lightningRef.current = { active: false, brightness: 0 };
          }, 80);
        }, 100);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Main Raycasting Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const fov = Math.PI / 3; // 60 degrees Field of View
      const halfFov = fov / 2;
      const numRays = Math.floor(width / 2); // 2px slices for crisp retro-horror rendering & high performance
      const sliceWidth = width / numRays;

      // Distance buffer for sprite depth sorting
      const zBuffer: number[] = new Array(numRays).fill(Infinity);

      // 1. Draw Ceiling & Floor with pitch darkness gradient
      const ceilingGrad = ctx.createLinearGradient(0, 0, 0, height / 2);
      ceilingGrad.addColorStop(0, '#020304');
      ceilingGrad.addColorStop(1, '#090d10');
      ctx.fillStyle = ceilingGrad;
      ctx.fillRect(0, 0, width, height / 2);

      const floorGrad = ctx.createLinearGradient(0, height / 2, 0, height);
      floorGrad.addColorStop(0, '#080a0c');
      floorGrad.addColorStop(1, '#020304');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height / 2, width, height / 2);

      // Check if ghosts are close for flashlight stutter
      let closestGhostDist = 999;
      let isAnyGhostChasing = false;
      ghosts.forEach((g) => {
        if (g.distanceToPlayer < closestGhostDist) closestGhostDist = g.distanceToPlayer;
        if (g.state === 'chase') isAnyGhostChasing = true;
      });

      // Calculate flashlight flicker probability
      let isFlickeringOff = false;
      if (player.flashlightOn) {
        if (player.flashlightBattery < 15 && Math.random() < 0.15) {
          isFlickeringOff = true;
        } else if (closestGhostDist < 7.0 && Math.random() < 0.22) {
          isFlickeringOff = true;
        }
      }

      const effectiveFlashlight = player.flashlightOn && !isFlickeringOff;

      // 2. Raycast Walls
      for (let i = 0; i < numRays; i++) {
        const rayAngle = player.angle - halfFov + (i / numRays) * fov;
        const cosRay = Math.cos(rayAngle);
        const sinRay = Math.sin(rayAngle);

        // Raycasting DDA setup
        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        const deltaDistX = Math.abs(1 / (cosRay === 0 ? 0.0001 : cosRay));
        const deltaDistY = Math.abs(1 / (sinRay === 0 ? 0.0001 : sinRay));

        let stepX: number;
        let stepY: number;
        let sideDistX: number;
        let sideDistY: number;

        if (cosRay < 0) {
          stepX = -1;
          sideDistX = (player.x - mapX) * deltaDistX;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }

        if (sinRay < 0) {
          stepY = -1;
          sideDistY = (player.y - mapY) * deltaDistY;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        let hit = 0;
        let side = 0; // 0 for X, 1 for Y
        let wallType = 1;
        let distance = 0;

        // March the ray
        const maxDist = 16.0;
        while (hit === 0 && distance < maxDist) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
          }

          if (mapX >= 0 && mapX < map.width && mapY >= 0 && mapY < map.height) {
            const tile = map.grid[mapY][mapX];
            if (tile > 0) {
              hit = 1;
              wallType = tile;
            }
          } else {
            break;
          }

          if (side === 0) {
            distance = (mapX - player.x + (1 - stepX) / 2) / cosRay;
          } else {
            distance = (mapY - player.y + (1 - stepY) / 2) / sinRay;
          }
        }

        // Correct fish-eye distortion
        const correctedDist = distance * Math.cos(rayAngle - player.angle);
        zBuffer[i] = correctedDist;

        if (hit > 0 && correctedDist > 0.05) {
          const lineHeight = Math.min(height * 2.5, (height / correctedDist));
          const drawStart = Math.max(0, -lineHeight / 2 + height / 2);
          const drawEnd = Math.min(height - 1, lineHeight / 2 + height / 2);

          // Calculate lighting: Flashlight cone angle + distance attenuation
          let lightFactor = 0.04; // Baseline shadow vision
          if (effectiveFlashlight) {
            const angleOffset = Math.abs(rayAngle - player.angle);
            // Flashlight cone: 30 degrees width
            if (angleOffset < Math.PI / 6) {
              const coneIntensity = Math.cos((angleOffset / (Math.PI / 6)) * (Math.PI / 2));
              const distAtten = Math.max(0, 1 - correctedDist / 12.0);
              lightFactor += coneIntensity * distAtten * 0.95;
            }
          }

          // Thunder flash adds ambient boost
          if (lightningRef.current.active) {
            lightFactor += lightningRef.current.brightness;
          }

          lightFactor = Math.min(1.0, lightFactor);

          // Darken perpendicular wall for fake 3D shadow depth
          if (side === 1) {
            lightFactor *= 0.75;
          }

          // Determine wall colors based on type
          let r = 35;
          let g = 48;
          let b = 42; // Decaying greenish hospital tile

          if (wallType === 2) {
            // Locked Door (Brownish rusted iron + stained wood)
            r = 75;
            g = 35;
            b = 25;
          } else if (wallType === 3) {
            // Main Exit Door (Industrial reinforced gate)
            r = 90;
            g = 20;
            b = 20;
          } else if (wallType === 4) {
            // Hospital Obstacle / Overturned bed
            r = 45;
            g = 55;
            b = 60;
          }

          // Apply lighting
          r = Math.floor(r * lightFactor);
          g = Math.floor(g * lightFactor);
          b = Math.floor(b * lightFactor);

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(i * sliceWidth, drawStart, sliceWidth + 0.5, drawEnd - drawStart);

          // Draw door indicators / glowing keyholes
          if ((wallType === 2 || wallType === 3) && lightFactor > 0.08) {
            ctx.fillStyle = wallType === 3 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(56, 189, 248, 0.6)';
            const midY = height / 2;
            const doorIndicatorSize = Math.max(3, lineHeight * 0.08);
            if (i % 6 === 0) {
              ctx.fillRect(i * sliceWidth, midY - doorIndicatorSize / 2, sliceWidth, doorIndicatorSize);
            }
          }
        }
      }

      // 3. Render Sprites (Items + Ghosts) with depth sorting
      interface SpriteObj {
        x: number;
        y: number;
        dist: number;
        type: 'ghost' | 'item';
        ghost?: Ghost;
        item?: WorldItem;
      }

      const sprites: SpriteObj[] = [];

      // Collect items
      map.items.forEach((item) => {
        if (!item.pickedUp) {
          const dx = item.x + 0.5 - player.x;
          const dy = item.y + 0.5 - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.3 && dist < 14.0) {
            sprites.push({ x: item.x + 0.5, y: item.y + 0.5, dist, type: 'item', item });
          }
        }
      });

      // Collect ghosts
      ghosts.forEach((ghost) => {
        const dx = ghost.x - player.x;
        const dy = ghost.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.2 && dist < 15.0) {
          sprites.push({ x: ghost.x, y: ghost.y, dist, type: 'ghost', ghost });
        }
      });

      // Sort sprites from farthest to closest (Painter's Algorithm)
      sprites.sort((a, b) => b.dist - a.dist);

      // Render each sprite
      sprites.forEach((sp) => {
        const spriteX = sp.x - player.x;
        const spriteY = sp.y - player.y;

        // Transform sprite with camera direction matrix
        const invDet = 1.0 / (Math.cos(player.angle) * Math.sin(player.angle + Math.PI / 2) - Math.sin(player.angle) * Math.cos(player.angle + Math.PI / 2));
        const transformX = invDet * (Math.sin(player.angle + Math.PI / 2) * spriteX - Math.cos(player.angle + Math.PI / 2) * spriteY);
        const transformY = invDet * (-Math.sin(player.angle) * spriteX + Math.cos(player.angle) * spriteY);

        if (transformY > 0.2) {
          const spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
          const spriteHeight = Math.abs(Math.floor(height / transformY));
          const spriteWidth = Math.abs(Math.floor(height / transformY));

          const drawStartY = Math.max(0, -spriteHeight / 2 + height / 2);
          const drawEndY = Math.min(height - 1, spriteHeight / 2 + height / 2);
          const drawStartX = Math.max(0, -spriteWidth / 2 + spriteScreenX);
          const drawEndX = Math.min(width - 1, spriteWidth / 2 + spriteScreenX);

          // Check if sprite is in view and not fully occluded
          const sliceIndex = Math.floor((spriteScreenX / width) * numRays);
          if (sliceIndex >= 0 && sliceIndex < numRays && transformY < zBuffer[sliceIndex]) {
            // Lighting for sprite
            let spriteLight = 0.05;
            if (effectiveFlashlight) {
              const angleToSprite = Math.atan2(spriteY, spriteX);
              let angleDiff = Math.abs(angleToSprite - player.angle);
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              angleDiff = Math.abs(angleDiff);

              if (angleDiff < Math.PI / 5) {
                const cone = Math.cos((angleDiff / (Math.PI / 5)) * (Math.PI / 2));
                const atten = Math.max(0, 1 - transformY / 11.0);
                spriteLight += cone * atten * 1.1;
              }
            }
            if (lightningRef.current.active) {
              spriteLight += lightningRef.current.brightness;
            }
            spriteLight = Math.min(1.0, spriteLight);

            // Draw Sprite Billboard
            if (sp.type === 'ghost' && sp.ghost) {
              const ghost = sp.ghost;
              const isChasing = ghost.state === 'chase';

              // If image asset loaded, draw translucent horrifying spirit billboard
              if (ghostImageRef.current && imageLoaded) {
                ctx.save();
                ctx.globalAlpha = Math.min(0.95, Math.max(0.2, spriteLight * 1.2));

                // Glitch offset when chasing or screaming
                const glitchX = (isChasing || ghost.screaming) ? (Math.random() - 0.5) * 12 : 0;
                const glitchY = (isChasing || ghost.screaming) ? (Math.random() - 0.5) * 6 : 0;

                // Ghost bobbing float animation
                const bobOffset = Math.sin(performance.now() * 0.003 + ghost.x * 2) * (spriteHeight * 0.05);

                ctx.drawImage(
                  ghostImageRef.current,
                  drawStartX + glitchX,
                  drawStartY + bobOffset + glitchY,
                  drawEndX - drawStartX,
                  drawEndY - drawStartY
                );

                // Terrifying red glowing eyes aura when chasing
                if (isChasing || ghost.screaming) {
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
                  ctx.beginPath();
                  ctx.arc(spriteScreenX + glitchX, drawStartY + spriteHeight * 0.35 + bobOffset, spriteWidth * 0.2, 0, Math.PI * 2);
                  ctx.fill();
                }

                ctx.restore();
              } else {
                // Procedural Spectral Figure fallback
                ctx.save();
                ctx.globalAlpha = Math.min(0.9, spriteLight + 0.2);
                ctx.fillStyle = isChasing ? 'rgba(239, 68, 68, 0.8)' : 'rgba(224, 242, 254, 0.7)';
                ctx.beginPath();
                ctx.ellipse(spriteScreenX, height / 2, spriteWidth * 0.3, spriteHeight * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();

                // Glowing eye slots
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(spriteScreenX - spriteWidth * 0.1, height / 2 - spriteHeight * 0.2, spriteWidth * 0.06, spriteHeight * 0.06);
                ctx.fillRect(spriteScreenX + spriteWidth * 0.04, height / 2 - spriteHeight * 0.2, spriteWidth * 0.06, spriteHeight * 0.06);
                ctx.restore();
              }
            } else if (sp.type === 'item' && sp.item) {
              const item = sp.item;
              const itemSize = Math.max(8, spriteHeight * 0.28);
              const itemY = height / 2 + spriteHeight * 0.25;

              ctx.save();
              ctx.globalAlpha = Math.min(1.0, spriteLight + 0.3);

              if (item.type === 'key' && item.keyId) {
                const keyDef = KEY_DEFINITIONS[item.keyId];
                // Glowing golden / colored key aura
                const pulse = Math.sin(performance.now() * 0.006) * 4;
                ctx.fillStyle = keyDef.color;
                ctx.shadowColor = keyDef.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(spriteScreenX, itemY + pulse, itemSize * 0.7, 0, Math.PI * 2);
                ctx.fill();

                // Key stem icon
                ctx.fillStyle = '#000000';
                ctx.fillRect(spriteScreenX - 2, itemY + pulse - 2, 4, itemSize * 0.8);
              } else if (item.type === 'battery') {
                // Battery cylinder (Green glowing)
                ctx.fillStyle = '#22c55e';
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 10;
                ctx.fillRect(spriteScreenX - itemSize * 0.4, itemY - itemSize * 0.6, itemSize * 0.8, itemSize * 1.2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(spriteScreenX - itemSize * 0.2, itemY - itemSize * 0.8, itemSize * 0.4, itemSize * 0.2);
              } else if (item.type === 'medkit') {
                // First Aid Kit (Red/White Box)
                ctx.fillStyle = '#f8fafc';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillRect(spriteScreenX - itemSize * 0.6, itemY - itemSize * 0.4, itemSize * 1.2, itemSize * 0.8);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(spriteScreenX - itemSize * 0.15, itemY - itemSize * 0.3, itemSize * 0.3, itemSize * 0.6);
                ctx.fillRect(spriteScreenX - itemSize * 0.35, itemY - itemSize * 0.12, itemSize * 0.7, itemSize * 0.24);
              } else if (item.type === 'note') {
                // Lore note clipboard
                ctx.fillStyle = '#fef08a';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 8;
                ctx.fillRect(spriteScreenX - itemSize * 0.4, itemY - itemSize * 0.5, itemSize * 0.8, itemSize * 1.0);
              } else if (item.type === 'locker') {
                // Hiding Locker (Tall industrial steel locker)
                ctx.fillStyle = '#164e63';
                ctx.fillRect(spriteScreenX - spriteWidth * 0.25, height / 2 - spriteHeight * 0.4, spriteWidth * 0.5, spriteHeight * 0.85);
                ctx.fillStyle = '#082f49';
                ctx.fillRect(spriteScreenX - spriteWidth * 0.2, height / 2 - spriteHeight * 0.35, spriteWidth * 0.4, spriteHeight * 0.75);
                // Locker vent slats
                ctx.fillStyle = '#0f172a';
                for (let v = 0; v < 4; v++) {
                  ctx.fillRect(spriteScreenX - spriteWidth * 0.12, height / 2 - spriteHeight * 0.25 + v * 8, spriteWidth * 0.24, 3);
                }
              }

              ctx.restore();
            }
          }
        }
      });

      // 4. Horror Atmosphere & Post-processing FX
      // Flashlight vignette cone overlay
      if (effectiveFlashlight) {
        const spotGrad = ctx.createRadialGradient(
          width / 2, height / 2, width * 0.05,
          width / 2, height / 2, width * 0.58
        );
        spotGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        spotGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0.96)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Heavy pitch blackness with subtle pupil dilation
        const darkGrad = ctx.createRadialGradient(
          width / 2, height / 2, 40,
          width / 2, height / 2, width * 0.45
        );
        darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Sanity Vignette (pulsing red border as sanity depletes)
      if (player.sanity < 60) {
        const fearIntensity = (1 - player.sanity / 60);
        const pulse = Math.sin(performance.now() * 0.005) * 0.15 + 0.85;
        const redVignette = ctx.createRadialGradient(
          width / 2, height / 2, width * 0.3,
          width / 2, height / 2, width * 0.65
        );
        redVignette.addColorStop(0, 'rgba(185, 28, 28, 0)');
        redVignette.addColorStop(1, `rgba(185, 28, 28, ${fearIntensity * 0.7 * pulse})`);
        ctx.fillStyle = redVignette;
        ctx.fillRect(0, 0, width, height);
      }

      // Static noise / Radio interference when ghosts are close
      if (closestGhostDist < 9.0 || isAnyGhostChasing) {
        const noiseAlpha = Math.min(0.45, (1 - closestGhostDist / 9.0) * 0.45);
        ctx.fillStyle = `rgba(255, 255, 255, ${noiseAlpha * (Math.random() * 0.5 + 0.5)})`;
        for (let s = 0; s < 60; s++) {
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          ctx.fillRect(rx, ry, Math.random() * 4 + 1, Math.random() * 2 + 1);
        }
      }

      // VHS Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

      // 5. Jumpscare attack screen overlay
      if (isJumpscare && activeJumpscareGhost && ghostImageRef.current) {
        ctx.save();
        const violentShakeX = (Math.random() - 0.5) * 35;
        const violentShakeY = (Math.random() - 0.5) * 35;
        ctx.fillStyle = 'rgba(185, 28, 28, 0.45)';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(
          ghostImageRef.current,
          width * 0.15 + violentShakeX,
          height * 0.05 + violentShakeY,
          width * 0.7,
          height * 0.9
        );
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [player, ghosts, map, imageLoaded, isJumpscare, activeJumpscareGhost]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Crosshair / Reticle for interaction */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full border ${closestInteractable ? 'bg-amber-400 border-amber-300 scale-150' : 'bg-white/40 border-white/20'} transition-transform duration-150`} />
      </div>

      {/* Dynamic Interaction Prompt */}
      {closestInteractable && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/85 border border-amber-500/50 text-amber-200 px-4 py-2 rounded shadow-2xl backdrop-blur flex items-center gap-3 animate-pulse">
          <span className="bg-amber-500 text-black font-bold text-xs px-2 py-0.5 rounded">
            E
          </span>
          <span className="text-sm font-semibold tracking-wide">
            {closestInteractable.type === 'door' && (
              (closestInteractable.obj as Door).isExit
                ? 'Buksan ang Pangunahing Lagusan (Exit)'
                : `Buksan ang ${(closestInteractable.obj as Door).name}`
            )}
            {closestInteractable.type === 'item' && (
              (closestInteractable.obj as WorldItem).type === 'key'
                ? `Pulutin ang ${KEY_DEFINITIONS[(closestInteractable.obj as WorldItem).keyId!].name}`
                : (closestInteractable.obj as WorldItem).type === 'battery'
                ? 'Pulutin ang Baterya (+40% Ilaw)'
                : (closestInteractable.obj as WorldItem).type === 'medkit'
                ? 'Gamitin ang Gamot Pampakalma (+Sanity)'
                : (closestInteractable.obj as WorldItem).type === 'note'
                ? 'Basahin ang Talaarawan / Rekord'
                : 'Magtago sa Locker [Ligtas]'
            )}
          </span>
        </div>
      )}
    </div>
  );
};
