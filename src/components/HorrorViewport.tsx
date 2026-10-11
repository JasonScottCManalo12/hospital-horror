import React, { useEffect, useRef, useState } from 'react';
import { Door, Ghost, HospitalMap, Player, WorldItem } from '../types/horrorGame';
import { KEY_DEFINITIONS } from '../services/hospitalGenerator';

// Image assets
import wallTexSrc from '../assets/images/hospital_wall_texture_1791726495582.jpg';
import doorTexSrc from '../assets/images/hospital_door_texture_1791726511743.jpg';
import handTexSrc from '../assets/images/player_flashlight_hand_1791726529727.jpg';
import nurseTexSrc from '../assets/images/ghost_nurse_dolores_1791726545154.jpg';
import javierTexSrc from '../assets/images/ghost_doctor_javier_1791726558407.jpg';
import patientTexSrc from '../assets/images/vengeful_spirit_1791720067076.jpg';

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

  // Loaded textures storage
  const texturesRef = useRef<{
    wall: HTMLImageElement | null;
    door: HTMLImageElement | null;
    hand: HTMLImageElement | null;
    nurse: HTMLImageElement | null;
    javier: HTMLImageElement | null;
    patient: HTMLImageElement | null;
  }>({
    wall: null,
    door: null,
    hand: null,
    nurse: null,
    javier: null,
    patient: null,
  });

  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // Lighting & viewmodel bob state
  const lightningRef = useRef<{ active: boolean; brightness: number }>({ active: false, brightness: 0 });
  const bobPhaseRef = useRef<number>(0);
  const dustParticlesRef = useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; alpha: number }>>([]);

  // Initialize floating dust motes
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 640,
        y: Math.random() * 360,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3 - 0.15,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
    dustParticlesRef.current = particles;
  }, []);

  // Preload graphic textures
  useEffect(() => {
    const loadImg = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      });
    };

    Promise.all([
      loadImg(wallTexSrc),
      loadImg(doorTexSrc),
      loadImg(handTexSrc),
      loadImg(nurseTexSrc),
      loadImg(javierTexSrc),
      loadImg(patientTexSrc),
    ]).then(([wall, door, hand, nurse, javier, patient]) => {
      texturesRef.current = { wall, door, hand, nurse, javier, patient };
      setTexturesLoaded(true);
    });
  }, []);

  // Random thunder flashes and fluorescent light sparks
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.28) {
        lightningRef.current = { active: true, brightness: 0.9 };
        setTimeout(() => {
          lightningRef.current = { active: true, brightness: 0.45 };
          setTimeout(() => {
            lightningRef.current = { active: false, brightness: 0 };
          }, 70);
        }, 90);
      }
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  // Main Raycast Loop with Real Graphic Texturing & Viewmodel Hands
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const fov = Math.PI / 3; // 60 degrees FOV
      const halfFov = fov / 2;
      const numRays = Math.floor(width / 2); // 320 slices (2px per slice)
      const sliceWidth = width / numRays;

      const zBuffer: number[] = new Array(numRays).fill(Infinity);
      const textures = texturesRef.current;

      // 1. Ceiling & Floor Gradients
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, height / 2);
      ceilGrad.addColorStop(0, '#010203');
      ceilGrad.addColorStop(1, '#070b0d');
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, width, height / 2);

      const floorGrad = ctx.createLinearGradient(0, height / 2, 0, height);
      floorGrad.addColorStop(0, '#060809');
      floorGrad.addColorStop(1, '#010202');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height / 2, width, height / 2);

      // Check proximity for light flickering
      let closestGhostDist = 999;
      let isAnyGhostChasing = false;
      ghosts.forEach((g) => {
        if (g.distanceToPlayer < closestGhostDist) closestGhostDist = g.distanceToPlayer;
        if (g.state === 'chase') isAnyGhostChasing = true;
      });

      let isFlickeringOff = false;
      if (player.flashlightOn) {
        if (player.flashlightBattery < 18 && Math.random() < 0.2) isFlickeringOff = true;
        if (closestGhostDist < 7.0 && Math.random() < 0.25) isFlickeringOff = true;
      }
      const effectiveFlashlight = player.flashlightOn && !isFlickeringOff;

      // 2. Raycast Textured Walls & Doors
      for (let i = 0; i < numRays; i++) {
        const rayAngle = player.angle - halfFov + (i / numRays) * fov;
        const cosRay = Math.cos(rayAngle);
        const sinRay = Math.sin(rayAngle);

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
        let side = 0;
        let wallType = 1;
        let distance = 0;

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

        const correctedDist = distance * Math.cos(rayAngle - player.angle);
        zBuffer[i] = correctedDist;

        if (hit > 0 && correctedDist > 0.05) {
          const lineHeight = Math.min(height * 2.5, height / correctedDist);
          const drawStart = Math.max(0, -lineHeight / 2 + height / 2);
          const drawEnd = Math.min(height - 1, lineHeight / 2 + height / 2);

          // Calculate lighting: flashlight spotlight cone + distance attenuation
          let lightFactor = 0.03;
          if (effectiveFlashlight) {
            const angleOffset = Math.abs(rayAngle - player.angle);
            if (angleOffset < Math.PI / 6) {
              const coneIntensity = Math.cos((angleOffset / (Math.PI / 6)) * (Math.PI / 2));
              const distAtten = Math.max(0, 1 - correctedDist / 12.0);
              lightFactor += coneIntensity * distAtten * 0.97;
            }
          }
          if (lightningRef.current.active) {
            lightFactor += lightningRef.current.brightness;
          }
          lightFactor = Math.min(1.0, lightFactor);
          if (side === 1) lightFactor *= 0.78; // Shadow side

          // Texture Sampling Coordinate (0.0 to 1.0)
          let wallHitX: number;
          if (side === 0) {
            wallHitX = player.y + distance * sinRay;
          } else {
            wallHitX = player.x + distance * cosRay;
          }
          wallHitX -= Math.floor(wallHitX);

          const isDoor = wallType === 2 || wallType === 3;
          const targetTex = isDoor && textures.door ? textures.door : textures.wall;

          const screenX = i * sliceWidth;

          if (targetTex && texturesLoaded) {
            const texWidth = targetTex.width;
            const texHeight = targetTex.height;
            let texX = Math.floor(wallHitX * texWidth);
            if (side === 0 && cosRay > 0) texX = texWidth - texX - 1;
            if (side === 1 && sinRay < 0) texX = texWidth - texX - 1;

            // Draw textured vertical stripe
            ctx.drawImage(
              targetTex,
              texX,
              0,
              1,
              texHeight,
              screenX,
              drawStart,
              sliceWidth + 0.5,
              drawEnd - drawStart
            );

            // Shading overlay to represent darkness & lighting
            const darknessAlpha = Math.max(0, 1 - lightFactor);
            ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
            ctx.fillRect(screenX, drawStart, sliceWidth + 0.5, drawEnd - drawStart);

            // Colored door lock glow
            if (isDoor && lightFactor > 0.08) {
              const midY = height / 2;
              const lockGlow = wallType === 3 ? 'rgba(234, 179, 8, 0.65)' : 'rgba(56, 189, 248, 0.55)';
              ctx.fillStyle = lockGlow;
              if (i % 6 === 0) {
                ctx.fillRect(screenX, midY - 6, sliceWidth, 12);
              }
            }
          } else {
            // Fallback solid shading
            const c = Math.floor(lightFactor * 80);
            ctx.fillStyle = `rgb(${c},${c},${c})`;
            ctx.fillRect(screenX, drawStart, sliceWidth + 0.5, drawEnd - drawStart);
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

      map.items.forEach((item) => {
        if (!item.pickedUp) {
          const dx = item.x + 0.5 - player.x;
          const dy = item.y + 0.5 - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.25 && dist < 14.0) {
            sprites.push({ x: item.x + 0.5, y: item.y + 0.5, dist, type: 'item', item });
          }
        }
      });

      ghosts.forEach((ghost) => {
        const dx = ghost.x - player.x;
        const dy = ghost.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.2 && dist < 15.0) {
          sprites.push({ x: ghost.x, y: ghost.y, dist, type: 'ghost', ghost });
        }
      });

      sprites.sort((a, b) => b.dist - a.dist);

      sprites.forEach((sp) => {
        const spriteX = sp.x - player.x;
        const spriteY = sp.y - player.y;

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

          const sliceIndex = Math.floor((spriteScreenX / width) * numRays);
          if (sliceIndex >= 0 && sliceIndex < numRays && transformY < zBuffer[sliceIndex]) {
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

            // GHOST RENDERING
            if (sp.type === 'ghost' && sp.ghost) {
              const ghost = sp.ghost;
              const isChasing = ghost.state === 'chase';

              // Pick ghost texture based on ghost identity
              let ghostImg = textures.patient;
              if (ghost.type === 'dolores' && textures.nurse) ghostImg = textures.nurse;
              else if (ghost.type === 'javier' && textures.javier) ghostImg = textures.javier;

              if (ghostImg) {
                ctx.save();
                ctx.globalAlpha = Math.min(0.96, Math.max(0.35, spriteLight * 1.3));

                const glitchX = (isChasing || ghost.screaming) ? (Math.random() - 0.5) * 14 : 0;
                const glitchY = (isChasing || ghost.screaming) ? (Math.random() - 0.5) * 8 : 0;
                const bob = Math.sin(performance.now() * 0.003 + ghost.x * 2) * (spriteHeight * 0.06);

                ctx.drawImage(
                  ghostImg,
                  drawStartX + glitchX,
                  drawStartY + bob + glitchY,
                  drawEndX - drawStartX,
                  drawEndY - drawStartY
                );

                // Terrifying red glowing aura when chasing
                if (isChasing || ghost.screaming) {
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                  ctx.beginPath();
                  ctx.arc(spriteScreenX + glitchX, drawStartY + spriteHeight * 0.35 + bob, spriteWidth * 0.22, 0, Math.PI * 2);
                  ctx.fill();
                }

                ctx.restore();
              }
            }
            // ITEM RENDERING
            else if (sp.type === 'item' && sp.item) {
              const item = sp.item;
              const itemSize = Math.max(10, spriteHeight * 0.3);
              const itemY = height / 2 + spriteHeight * 0.22;

              ctx.save();
              ctx.globalAlpha = Math.min(1.0, spriteLight + 0.35);

              if (item.type === 'key' && item.keyId) {
                const keyDef = KEY_DEFINITIONS[item.keyId];
                const pulse = Math.sin(performance.now() * 0.006) * 5;
                ctx.fillStyle = keyDef.color;
                ctx.shadowColor = keyDef.color;
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(spriteScreenX, itemY + pulse, itemSize * 0.75, 0, Math.PI * 2);
                ctx.fill();

                // Key shank & teeth
                ctx.fillStyle = '#000';
                ctx.fillRect(spriteScreenX - 2, itemY + pulse - 2, 4, itemSize * 0.85);
                ctx.fillRect(spriteScreenX - 6, itemY + pulse + itemSize * 0.5, 6, 3);
              } else if (item.type === 'battery') {
                ctx.fillStyle = '#22c55e';
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 12;
                ctx.fillRect(spriteScreenX - itemSize * 0.4, itemY - itemSize * 0.6, itemSize * 0.8, itemSize * 1.2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(spriteScreenX - itemSize * 0.2, itemY - itemSize * 0.8, itemSize * 0.4, itemSize * 0.2);
              } else if (item.type === 'medkit') {
                ctx.fillStyle = '#f8fafc';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 12;
                ctx.fillRect(spriteScreenX - itemSize * 0.6, itemY - itemSize * 0.4, itemSize * 1.2, itemSize * 0.8);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(spriteScreenX - itemSize * 0.15, itemY - itemSize * 0.3, itemSize * 0.3, itemSize * 0.6);
                ctx.fillRect(spriteScreenX - itemSize * 0.35, itemY - itemSize * 0.12, itemSize * 0.7, itemSize * 0.24);
              } else if (item.type === 'note') {
                ctx.fillStyle = '#fef08a';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.fillRect(spriteScreenX - itemSize * 0.4, itemY - itemSize * 0.5, itemSize * 0.8, itemSize * 1.0);
              } else if (item.type === 'locker') {
                ctx.fillStyle = '#164e63';
                ctx.fillRect(spriteScreenX - spriteWidth * 0.25, height / 2 - spriteHeight * 0.4, spriteWidth * 0.5, spriteHeight * 0.85);
                ctx.fillStyle = '#082f49';
                ctx.fillRect(spriteScreenX - spriteWidth * 0.2, height / 2 - spriteHeight * 0.35, spriteWidth * 0.4, spriteHeight * 0.75);
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

      // 4. Volumetric Dust Particles in Flashlight Beam
      if (effectiveFlashlight) {
        ctx.save();
        dustParticlesRef.current.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Only bright in center beam cone
          const distToCenter = Math.hypot(p.x - width / 2, p.y - height / 2);
          if (distToCenter < width * 0.4) {
            ctx.fillStyle = `rgba(255, 255, 230, ${p.alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // 5. Flashlight Vignette / Outer Darkness Mask
      if (effectiveFlashlight) {
        const spotGrad = ctx.createRadialGradient(
          width / 2, height / 2, width * 0.08,
          width / 2, height / 2, width * 0.58
        );
        spotGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        spotGrad.addColorStop(0.62, 'rgba(0, 0, 0, 0.4)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0.96)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const darkGrad = ctx.createRadialGradient(
          width / 2, height / 2, 40,
          width / 2, height / 2, width * 0.45
        );
        darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 6. Viewmodel: Player Hands Holding Flashlight (First Person Graphic)
      if (textures.hand && texturesLoaded) {
        ctx.save();

        // Calculate natural bobbing & breathing
        bobPhaseRef.current += player.isSprinting ? 0.16 : 0.06;
        const walkBobX = Math.cos(bobPhaseRef.current) * (player.isSprinting ? 12 : 5);
        const walkBobY = Math.abs(Math.sin(bobPhaseRef.current)) * (player.isSprinting ? 16 : 7);

        // Idle breathing
        const breathY = Math.sin(performance.now() * 0.002) * 4;

        // If flashlight is off, lower the hand down
        const handOffsetY = player.flashlightOn ? 0 : height * 0.35;

        const handWidth = width * 0.72;
        const handHeight = height * 0.72;
        const handX = (width - handWidth) / 2 + walkBobX;
        const handY = height - handHeight + walkBobY + breathY + handOffsetY + 18;

        // Dim hands when light is off
        ctx.globalAlpha = player.flashlightOn ? 0.92 : 0.4;
        ctx.drawImage(textures.hand, handX, handY, handWidth, handHeight);

        ctx.restore();
      }

      // 7. Sanity Vignette (pulsing red blood when low sanity)
      if (player.sanity < 60) {
        const fearIntensity = (1 - player.sanity / 60);
        const pulse = Math.sin(performance.now() * 0.006) * 0.15 + 0.85;
        const redVignette = ctx.createRadialGradient(
          width / 2, height / 2, width * 0.28,
          width / 2, height / 2, width * 0.65
        );
        redVignette.addColorStop(0, 'rgba(185, 28, 28, 0)');
        redVignette.addColorStop(1, `rgba(185, 28, 28, ${fearIntensity * 0.75 * pulse})`);
        ctx.fillStyle = redVignette;
        ctx.fillRect(0, 0, width, height);
      }

      // 8. Static Noise / Radio Glitch when ghosts are close
      if (closestGhostDist < 9.0 || isAnyGhostChasing) {
        const noiseAlpha = Math.min(0.48, (1 - closestGhostDist / 9.0) * 0.48);
        ctx.fillStyle = `rgba(255, 255, 255, ${noiseAlpha * (Math.random() * 0.5 + 0.5)})`;
        for (let s = 0; s < 75; s++) {
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          ctx.fillRect(rx, ry, Math.random() * 4 + 1, Math.random() * 2 + 1);
        }
      }

      // 9. Found-Footage VHS Overlay & Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

      // 10. Jumpscare Graphic Attack Screen
      if (isJumpscare && activeJumpscareGhost) {
        let jumpImg = textures.patient;
        if (activeJumpscareGhost.type === 'dolores') jumpImg = textures.nurse;
        else if (activeJumpscareGhost.type === 'javier') jumpImg = textures.javier;

        if (jumpImg) {
          ctx.save();
          const violentShakeX = (Math.random() - 0.5) * 40;
          const violentShakeY = (Math.random() - 0.5) * 40;
          ctx.fillStyle = 'rgba(185, 28, 28, 0.5)';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(
            jumpImg,
            width * 0.08 + violentShakeX,
            height * 0.02 + violentShakeY,
            width * 0.84,
            height * 0.96
          );
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [player, ghosts, map, texturesLoaded, isJumpscare, activeJumpscareGhost]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Found Footage VHS Camcorder Graphics HUD (Top Left) */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 font-mono text-[11px] text-red-500 drop-shadow-md select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
          <span className="font-bold tracking-widest text-red-400">REC [SP]</span>
        </div>
        <div className="text-zinc-400 text-[10px]">
          1984-10-12 · SAN LAZARO WARD 4
        </div>
      </div>

      {/* Crosshair / Reticle for interaction */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full border ${closestInteractable ? 'bg-amber-400 border-amber-300 scale-150' : 'bg-white/40 border-white/20'} transition-transform duration-150 shadow-lg`} />
      </div>

      {/* Dynamic Interaction Prompt */}
      {closestInteractable && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/90 border border-amber-500/70 text-amber-200 px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-pulse">
          <span className="bg-amber-500 text-black font-extrabold text-xs px-2.5 py-1 rounded shadow">
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
                ? 'Pulutin ang Baterya (+45% Ilaw)'
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
