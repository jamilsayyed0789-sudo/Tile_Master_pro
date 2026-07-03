"use client";

import React, { useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, BakeShadows, useTexture, Environment } from "@react-three/drei";
import * as THREE from "three";
import { TILE_WALL_PBR, TILE_FLOOR_PBR } from "@/components/scene3d/tilePbr";
import BathroomFurnishings from "@/components/scene3d/BathroomFurnishings";

interface Visualizer3DProps {
  layoutId: string;
  wallTileUrl: string | null;
  floorTileUrl: string | null;
  accentTileUrl: string | null;
  tileW?: number;
  tileH?: number;
}



interface Segment {
  size: number;
  tileType: 'wall' | 'floor' | 'accent' | 'horizontal_stripes';
  rotation?: number;
}

interface SplitPlaneProps {
  direction: 'none' | 'horizontal' | 'vertical' | 'checkerboard' | 'border';
  args: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  segments?: Segment[];
  tileType?: 'wall' | 'floor' | 'accent' | 'horizontal_stripes';
  wallTileUrl: string | null;
  floorTileUrl: string | null;
  accentTileUrl: string | null;
  tileW: number;
  tileH: number;
  rotationOffset?: number;
  isFloorPlane?: boolean;
}

function SplitPlane({
  direction,
  args,
  position,
  rotation,
  segments = [],
  tileType = 'wall',
  wallTileUrl,
  floorTileUrl,
  accentTileUrl,
  tileW,
  tileH,
  rotationOffset = 0,
  isFloorPlane = false
}: SplitPlaneProps) {
  const getTileUrl = (type: 'wall' | 'floor' | 'accent' | 'horizontal_stripes') => {
    if (type === 'wall') return wallTileUrl;
    if (type === 'floor') return floorTileUrl;
    return accentTileUrl || wallTileUrl;
  };

  const getIsFloor = (type: 'wall' | 'floor' | 'accent' | 'horizontal_stripes') => {
    if (isFloorPlane) return true;
    return type === 'floor';
  };

  if (direction === 'none') {
    return (
      <TexturedPlane
        url={getTileUrl(tileType)}
        position={position}
        rotation={rotation}
        args={args}
        isFloor={getIsFloor(tileType)}
        tileW={tileW}
        tileH={tileH}
        rotationOffset={rotationOffset}
      />
    );
  }

  const [w, h] = args;

  if (direction === 'horizontal') {
    let currentY = -h / 2;
    return (
      <group position={position} rotation={rotation}>
        {segments.map((seg, i) => {
          const segH = seg.size;
          const yPos = currentY + segH / 2;
          currentY += segH;
          return (
            <TexturedPlane
              key={i}
              url={getTileUrl(seg.tileType)}
              position={[0, yPos, 0]}
              rotation={[0, 0, 0]}
              args={[w, segH]}
              isFloor={getIsFloor(seg.tileType)}
              tileW={tileW}
              tileH={tileH}
              rotationOffset={seg.rotation}
            />
          );
        })}
      </group>
    );
  }

  if (direction === 'vertical') {
    let currentX = -w / 2;
    return (
      <group position={position} rotation={rotation}>
        {segments.map((seg, i) => {
          const segW = seg.size;
          const xPos = currentX + segW / 2;
          currentX += segW;
          return seg.tileType === 'horizontal_stripes' ? (
            <HorizontalStripedPlane
              key={i}
              wallUrl={wallTileUrl}
              accentUrl={accentTileUrl}
              position={[xPos, 0, 0]}
              rotation={[0, 0, 0]}
              args={[segW, h]}
              tileW={tileW}
              tileH={tileH}
              stripeH={0.5} // 6 inch stripes
            />
          ) : (
            <TexturedPlane
              key={i}
              url={getTileUrl(seg.tileType as any)}
              position={[xPos, 0, 0]}
              rotation={[0, 0, 0]}
              args={[segW, h]}
              isFloor={getIsFloor(seg.tileType as any)}
              tileW={tileW}
              tileH={tileH}
              rotationOffset={seg.rotation}
            />
          );
        })}
      </group>
    );
  }

  if (direction === 'checkerboard') {
    const tileSize = 2; // 2x2 feet tiles
    const cols = Math.ceil(w / tileSize);
    const rows = Math.ceil(h / tileSize);
    const cells = [];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const isAccent = (c + r) % 2 === 1;
        const type = isAccent ? 'accent' : tileType;
        const cellW = Math.min(tileSize, w - c * tileSize);
        const cellH = Math.min(tileSize, h - r * tileSize);
        const x = -w / 2 + c * tileSize + cellW / 2;
        const y = -h / 2 + r * tileSize + cellH / 2;

        cells.push(
          <TexturedPlane
            key={`${c}-${r}`}
            url={getTileUrl(type)}
            position={[x, y, 0]}
            rotation={[0, 0, 0]}
            args={[cellW, cellH]}
            isFloor={getIsFloor(type)}
            tileW={tileW}
            tileH={tileH}
          />
        );
      }
    }

    return (
      <group position={position} rotation={rotation}>
        {cells}
      </group>
    );
  }

  if (direction === 'border') {
    const borderWidth = 1.5;
    return (
      <group position={position} rotation={rotation}>
        <TexturedPlane url={getTileUrl('accent')} position={[-w / 2 + borderWidth / 2, 0, 0]} rotation={[0, 0, 0]} args={[borderWidth, h]} isFloor={getIsFloor(tileType)} tileW={tileW} tileH={tileH} />
        <TexturedPlane url={getTileUrl('accent')} position={[w / 2 - borderWidth / 2, 0, 0]} rotation={[0, 0, 0]} args={[borderWidth, h]} isFloor={getIsFloor(tileType)} tileW={tileW} tileH={tileH} />
        <TexturedPlane url={getTileUrl('accent')} position={[0, h / 2 - borderWidth / 2, 0]} rotation={[0, 0, 0]} args={[w - borderWidth * 2, borderWidth]} isFloor={getIsFloor(tileType)} tileW={tileW} tileH={tileH} />
        <TexturedPlane url={getTileUrl('accent')} position={[0, -h / 2 + borderWidth / 2, 0]} rotation={[0, 0, 0]} args={[w - borderWidth * 2, borderWidth]} isFloor={getIsFloor(tileType)} tileW={tileW} tileH={tileH} />
        <TexturedPlane url={getTileUrl(tileType)} position={[0, 0, 0]} rotation={[0, 0, 0]} args={[w - borderWidth * 2, h - borderWidth * 2]} isFloor={getIsFloor(tileType)} tileW={tileW} tileH={tileH} />
      </group>
    );
  }

  return null;
}

function Room3D({
  layoutId,
  wallTileUrl,
  floorTileUrl,
  accentTileUrl,
  tileW = 2,
  tileH = 2
}: Visualizer3DProps) {
  const roomW = 10;
  const roomL = 12;
  const roomH = 10;
  const accentWidth = 4;
  const sideWallWidth = (roomW - accentWidth) / 2;

  const renderWall = (pos: [number, number, number], rot: [number, number, number], args: [number, number], wallType: 'back' | 'side') => {
    if (layoutId === 'standard') {
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'diagonal_stripes') {
      if (wallType === 'back') {
        return (
          <DiagonalStripedPlane
            wallUrl={wallTileUrl}
            accentUrl={accentTileUrl}
            position={pos}
            rotation={rot}
            args={args}
            tileW={2} // Force tile width to 2ft
            tileH={1} // Force stripe thickness to exactly 1ft
          />
        );
      }
      // Side walls use standard wall tile
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'accent_back' || layoutId === 'split_floor_accent_back') {
      return <SplitPlane direction="none" tileType={wallType === 'back' ? 'accent' : 'wall'} args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'luxury') {
      if (wallType === 'back') {
        return (
          <group position={pos} rotation={rot}>
            <TexturedPlane url={wallTileUrl} position={[-3.5, 0, 0]} rotation={[0, 0, 0]} args={[3, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={wallTileUrl} position={[3.5, 0, 0]} rotation={[0, 0, 0]} args={[3, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={accentTileUrl || wallTileUrl} position={[0, 0, 0.4]} rotation={[0, 0, 0]} args={[4, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={accentTileUrl || wallTileUrl} position={[-2, 0, 0.2]} rotation={[0, -Math.PI / 2, 0]} args={[0.4, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={accentTileUrl || wallTileUrl} position={[2, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} args={[0.4, roomH]} tileW={tileW} tileH={tileH} />
          </group>
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'double_column') {
      if (wallType === 'back') {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: 2, tileType: 'wall' },
              { size: 2, tileType: 'accent' },
              { size: 2, tileType: 'wall' },
              { size: 2, tileType: 'accent' },
              { size: 2, tileType: 'wall' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'framed_monolith') {
      const stripeSegments = [
        { size: 2.0, tileType: 'wall' },
        { size: 0.5, tileType: 'accent' },
        { size: 1.0, tileType: 'wall' },
        { size: 0.5, tileType: 'accent' },
        { size: 2.0, tileType: 'wall' },
        { size: 0.5, tileType: 'accent' },
        { size: 1.0, tileType: 'wall' },
        { size: 0.5, tileType: 'accent' },
        { size: 2.0, tileType: 'wall' }
      ] as { size: number, tileType: 'wall' | 'accent' | 'floor' }[];

      if (wallType === 'back') {
        const cW = 4;
        const sW = (args[0] - cW) / 2;
        return (
          <group position={pos} rotation={rot}>
            <SplitPlane
              direction="horizontal"
              args={[sW, args[1]]}
              position={[-args[0]/2 + sW/2, 0, 0]}
              rotation={[0, 0, 0]}
              segments={stripeSegments}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
            <SplitPlane
              direction="horizontal"
              args={[sW, args[1]]}
              position={[args[0]/2 - sW/2, 0, 0]}
              rotation={[0, 0, 0]}
              segments={stripeSegments}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
            <TexturedPlane 
              url={accentTileUrl || wallTileUrl} 
              position={[0, 0, 0]} 
              rotation={[0, 0, 0]} 
              args={[cW, args[1]]} 
              tileW={tileW} 
              tileH={tileH} 
            />
          </group>
        );
      }
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={stripeSegments}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'striped_center_column') {
      if (wallType === 'back') {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: (roomW - 2) / 2, tileType: 'wall' },
              { size: 2, tileType: 'horizontal_stripes' },
              { size: (roomW - 2) / 2, tileType: 'wall' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'alternating_tower') {
      if (wallType === 'back') {
        const shortSide = Math.min(tileW, tileH);
        const longSide = Math.max(tileW, tileH);
        
        const cW = shortSide;
        const sW = (args[0] - cW) / 2;

        const centerSegments = [];
        let currentH = 0;
        
        centerSegments.push({ size: longSide, tileType: 'accent' });
        currentH += longSide;
        
        let isAccent = false;
        while (currentH < args[1]) {
          const remaining = args[1] - currentH;
          const size = Math.min(shortSide, remaining);
          centerSegments.push({ size: size, tileType: isAccent ? 'accent' : 'wall' });
          currentH += size;
          isAccent = !isAccent;
        }

        return (
          <group position={pos} rotation={rot}>
            <TexturedPlane url={wallTileUrl} position={[-args[0]/2 + sW/2, 0, 0]} rotation={[0,0,0]} args={[sW, args[1]]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={wallTileUrl} position={[args[0]/2 - sW/2, 0, 0]} rotation={[0,0,0]} args={[sW, args[1]]} tileW={tileW} tileH={tileH} />
            <SplitPlane
              direction="horizontal"
              args={[cW, args[1]]}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              segments={centerSegments as any}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
          </group>
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'showroom_columns') {
      if (wallType === 'back') {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: 2.5, tileType: 'accent' },
              { size: 5.0, tileType: 'wall' },
              { size: 2.5, tileType: 'accent' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'highlighter') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 3.3, tileType: 'wall' },
            { size: 1.2, tileType: 'accent' },
            { size: 5.5, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'double_highlighter') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 2, tileType: 'wall' },
            { size: 0.8, tileType: 'accent' },
            { size: 4.4, tileType: 'wall' },
            { size: 0.8, tileType: 'accent' },
            { size: 2, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'dado') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 4.5, tileType: 'accent' },
            { size: 5.5, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'accent_corners') {
      if (wallType === 'back') {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: 1.5, tileType: 'accent' },
              { size: 7, tileType: 'wall' },
              { size: 1.5, tileType: 'accent' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      const isLeft = pos[0] === 0;
      return (
        <SplitPlane
          direction="vertical"
          args={args}
          position={pos}
          rotation={rot}
          segments={
            isLeft 
              ? [{ size: 1.5, tileType: 'accent' }, { size: 10.5, tileType: 'wall' }]
              : [{ size: 10.5, tileType: 'wall' }, { size: 1.5, tileType: 'accent' }]
          }
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'accent_baseboard') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 1.2, tileType: 'accent' },
            { size: 8.8, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'accent_frieze') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 8.8, tileType: 'wall' },
            { size: 1.2, tileType: 'accent' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'vertical_pinstripes') {
      return (
        <SplitPlane
          direction="vertical"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 2.8, tileType: 'wall' },
            { size: 0.4, tileType: 'accent' },
            { size: 2.8, tileType: 'wall' },
            { size: 0.4, tileType: 'accent' },
            { size: 2.8, tileType: 'wall' },
            { size: 0.4, tileType: 'accent' },
            { size: 0.4, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'horizontal_pinstripes') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 2.3, tileType: 'wall' },
            { size: 0.2, tileType: 'accent' },
            { size: 2.3, tileType: 'wall' },
            { size: 0.2, tileType: 'accent' },
            { size: 2.3, tileType: 'wall' },
            { size: 0.2, tileType: 'accent' },
            { size: 2.5, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'diagonal_walls') {
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} rotationOffset={Math.PI / 4} />;
    }
    if (layoutId === 'three_tile_mix') {
      return (
        <SplitPlane
          direction="horizontal"
          args={args}
          position={pos}
          rotation={rot}
          segments={[
            { size: 3, tileType: 'floor' },
            { size: 1, tileType: 'accent' },
            { size: 6, tileType: 'wall' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
        />
      );
    }
    if (layoutId === 'picture_frame') {
      if (wallType === 'back') {
        return (
          <group position={pos} rotation={rot}>
            <TexturedPlane url={wallTileUrl} position={[-4, 0, 0]} rotation={[0, 0, 0]} args={[2, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={wallTileUrl} position={[4, 0, 0]} rotation={[0, 0, 0]} args={[2, roomH]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={wallTileUrl} position={[0, -4, 0]} rotation={[0, 0, 0]} args={[6, 2]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={wallTileUrl} position={[0, 4, 0]} rotation={[0, 0, 0]} args={[6, 2]} tileW={tileW} tileH={tileH} />
            <TexturedPlane url={accentTileUrl || wallTileUrl} position={[0, 0, 0.05]} rotation={[0, 0, 0]} args={[6, 6]} tileW={tileW} tileH={tileH} />
          </group>
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'modern_asymmetric') {
      const stripeSegments = Array.from({ length: 10 }).map((_, i) => ({
        size: 1,
        tileType: i % 2 === 0 ? 'accent' : 'wall'
      })) as { size: number, tileType: 'wall' | 'accent' | 'floor' }[];

      if (wallType === 'back') {
        const w1 = args[0] * 0.35; // left zone width
        const w2 = args[0] * 0.35; // mid zone width
        const w3 = args[0] * 0.3;  // right zone width
        return (
          <group position={pos} rotation={rot}>
            <SplitPlane 
              direction="horizontal"
              args={[w1, args[1]]}
              position={[-args[0]/2 + w1/2, 0, 0]}
              rotation={[0, 0, 0]}
              segments={stripeSegments}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
            <SplitPlane 
              direction="none"
              tileType="wall"
              args={[w2, args[1]]}
              position={[-args[0]/2 + w1 + w2/2, 0, 0]}
              rotation={[0, 0, 0]}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
            <SplitPlane 
              direction="horizontal"
              args={[w3, args[1]]}
              position={[-args[0]/2 + w1 + w2 + w3/2, 0, 0]}
              rotation={[0, 0, 0]}
              segments={[
                { size: 2, tileType: 'wall' },
                { size: 4, tileType: 'accent' },
                { size: 4, tileType: 'wall' }
              ]}
              wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
            />
          </group>
        );
      }
      const isLeft = pos[0] === 0;
      if (isLeft) {
        return (
          <SplitPlane
            direction="horizontal"
            args={args}
            position={pos}
            rotation={rot}
            segments={stripeSegments}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      } else {
        return (
          <SplitPlane
            direction="horizontal"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
                 { size: 2, tileType: 'wall' },
                 { size: 4, tileType: 'accent' },
                 { size: 4, tileType: 'wall' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
    }
    if (layoutId === 'shower_accent') {
      if (wallType === 'side' && pos[0] === 0) {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: 4, tileType: 'accent' },
              { size: 8, tileType: 'wall' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'shower_strip') {
      if (wallType === 'back') {
        return (
          <SplitPlane
            direction="vertical"
            args={args}
            position={pos}
            rotation={rot}
            segments={[
              { size: 4, tileType: 'wall' },
              { size: 2, tileType: 'accent' },
              { size: 4, tileType: 'wall' }
            ]}
            wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH}
          />
        );
      }
      return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
    }
    if (layoutId === 'herringbone_room') {
      return (
        <TexturedPlane 
          url={wallTileUrl} 
          position={pos} 
          rotation={rot} 
          args={args} 
          tileW={tileW} 
          tileH={tileH} 
          pattern="herringbone"
        />
      );
    }
    return <SplitPlane direction="none" tileType="wall" args={args} position={pos} rotation={rot} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} />;
  };

  const renderFloor = () => {
    if (layoutId === 'herringbone_room') {
      return (
        <TexturedPlane 
          url={floorTileUrl} 
          position={[roomW / 2, 0, roomL / 2]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          args={[roomW, roomL]} 
          isFloor
          pattern="mosaic"
        />
      );
    }
    if (layoutId === 'split_floor_accent_back') {
      return (
        <group>
          {/* Left half of the floor (Accent) */}
          <TexturedPlane 
            url={accentTileUrl || floorTileUrl} 
            position={[roomW / 4, 0, roomL / 2]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            args={[roomW / 2, roomL]} 
            isFloor 
            tileW={tileW} 
            tileH={tileH} 
          />
          {/* Right half of the floor (Floor Tile) */}
          <TexturedPlane 
            url={floorTileUrl} 
            position={[(roomW / 4) * 3, 0, roomL / 2]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            args={[roomW / 2, roomL]} 
            isFloor 
            tileW={tileW} 
            tileH={tileH} 
          />
        </group>
      );
    }
    const singleFloorLayouts = [
      'standard', 'accent_back', 'double_column', 'highlighter', 'double_highlighter',
      'dado', 'accent_corners', 'accent_baseboard', 'accent_frieze', 'vertical_pinstripes',
      'horizontal_pinstripes', 'three_tile_mix', 'picture_frame', 'shower_accent'
    ];
    if (singleFloorLayouts.includes(layoutId)) {
      return <SplitPlane direction="none" tileType="floor" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
    }
    if (layoutId === 'showroom_columns') {
      return (
        <SplitPlane 
          direction="vertical" 
          args={[roomW, roomL]} 
          position={[roomW / 2, 0, roomL / 2]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          segments={[
            { size: 2.5, tileType: 'accent' },
            { size: 5.0, tileType: 'wall' },
            { size: 2.5, tileType: 'accent' }
          ]}
          wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true}
        />
      );
    }
    if (layoutId === 'luxury') {
      return (
        <group>
          <TexturedPlane url={floorTileUrl} position={[sideWallWidth / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} args={[sideWallWidth, roomL]} isFloor tileW={tileW} tileH={tileH} />
          <TexturedPlane url={floorTileUrl} position={[roomW - sideWallWidth / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} args={[sideWallWidth, roomL]} isFloor tileW={tileW} tileH={tileH} />
          <TexturedPlane url={accentTileUrl || floorTileUrl} position={[roomW / 2, 0.01, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} args={[accentWidth, roomL]} isFloor tileW={tileW} tileH={tileH} />
        </group>
      );
    }
    if (layoutId === 'checkerboard_floor') {
      return <SplitPlane direction="checkerboard" tileType="floor" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
    }
    if (layoutId === 'diagonal_floor') {
      return <SplitPlane direction="none" tileType="floor" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
    }
    if (layoutId === 'border_floor') {
      return <SplitPlane direction="border" tileType="floor" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
    }
    if (layoutId === 'accent_floor' || layoutId === 'shower_strip') {
      return <SplitPlane direction="none" tileType="accent" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
    }
    return <SplitPlane direction="none" tileType="floor" args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} wallTileUrl={wallTileUrl} floorTileUrl={floorTileUrl} accentTileUrl={accentTileUrl} tileW={tileW} tileH={tileH} isFloorPlane={true} />;
  };

  return (
    <group>
      {renderWall([roomW / 2, roomH / 2, 0], [0, 0, 0], [roomW, roomH], 'back')}
      {renderWall([0, roomH / 2, roomL / 2], [0, Math.PI / 2, 0], [roomL, roomH], 'side')}
      {renderWall([roomW, roomH / 2, roomL / 2], [0, -Math.PI / 2, 0], [roomL, roomH], 'side')}
      {renderFloor()}
    </group>
  );
}

// Helper to create a repeating texture with a 2mm black epoxy grout border
function useRepeatingTexture(url: string | null, repeatX: number, repeatY: number, tileW: number, tileH: number) {
  const tex = useTexture(url || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
  
  const map = useMemo(() => {
    if (!tex || !url) return null;

    const canvas = document.createElement("canvas");
    const scale = 300; // pixels per foot
    const wPx = Math.round(tileW * scale);
    const hPx = Math.round(tileH * scale);
    canvas.width = wPx;
    canvas.height = hPx;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw tile image
    ctx.drawImage(tex.image as CanvasImageSource, 0, 0, wPx, hPx);

    // Draw 2mm black epoxy grout border
    const groutPx = 2 * (scale / 304.8); // 2mm in pixels
    ctx.strokeStyle = "#050505"; // deep black epoxy
    ctx.lineWidth = groutPx;
    ctx.strokeRect(0, 0, wPx, hPx);

    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(repeatX, repeatY);
    t.anisotropy = 16; // high clarity
    t.needsUpdate = true;
    return t;
  }, [tex, url, repeatX, repeatY, tileW, tileH]);

  return map;
}

// Hook to create a high-quality herringbone tile canvas texture with 2mm black epoxy grout
function useHerringboneTexture(url: string | null, wallW: number, wallH: number, tileW: number, tileH: number) {
  const tex = useTexture(url || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

  const map = useMemo(() => {
    if (!tex || !url) return null;

    const canvas = document.createElement("canvas");
    const scale = 250; // pixels per foot
    canvas.width = Math.round(wallW * scale);
    canvas.height = Math.round(wallH * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Scale down the large tile sizes so it looks like a realistic subway tile herringbone layout
    const L = (tileW / 3) * scale;
    const W = (tileH / 3) * scale;

    const stepX = (L + W) / Math.sqrt(2);
    const stepY = (L + W) / Math.sqrt(2);

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groutPx = 2 * (scale / 304.8); // 2mm in pixels

    // Draw repeating herringbone cells
    for (let x = -L * 2; x < canvas.width + L * 2; x += stepX) {
      for (let y = -L * 2; y < canvas.height + L * 2; y += stepY) {
        // Left-leaning tile
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.drawImage(tex.image as CanvasImageSource, -L / 2, -W / 2, L, W);
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = groutPx;
        ctx.strokeRect(-L / 2, -W / 2, L, W);
        ctx.restore();

        // Right-leaning tile
        ctx.save();
        ctx.translate(x + stepX / 2, y + stepY / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.drawImage(tex.image as CanvasImageSource, -L / 2, -W / 2, L, W);
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = groutPx;
        ctx.strokeRect(-L / 2, -W / 2, L, W);
        ctx.restore();
      }
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [tex, url, wallW, wallH, tileW, tileH]);

  return map;
}

// Hook to create a small mosaic grid texture with 2mm black epoxy grout
function useMosaicTexture(url: string | null, floorW: number, floorH: number) {
  const tex = useTexture(url || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

  const map = useMemo(() => {
    if (!tex || !url) return null;

    const canvas = document.createElement("canvas");
    const scale = 250;
    canvas.width = Math.round(floorW * scale);
    canvas.height = Math.round(floorH * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const size = 0.5 * scale; // 6 inch squares (0.5 feet)
    const groutPx = 2 * (scale / 304.8); // 2mm in pixels

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x += size) {
      for (let y = 0; y < canvas.height; y += size) {
        ctx.drawImage(tex.image as CanvasImageSource, x, y, size, size);
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = groutPx;
        ctx.strokeRect(x, y, size, size);
      }
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [tex, url, floorW, floorH]);

  return map;
}

function useHorizontalStripesTexture(
  wallUrl: string | null,
  accentUrl: string | null,
  wallW: number,
  wallH: number,
  tileW: number,
  stripeH: number = 0.5
) {
  const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const texWall = useTexture(wallUrl || fallback);
  const texAccent = useTexture(accentUrl || fallback);

  const map = useMemo(() => {
    if (!texWall || !texAccent || (!wallUrl && !accentUrl)) return null;

    const canvas = document.createElement("canvas");
    const scale = 250;
    canvas.width = Math.round(wallW * scale);
    canvas.height = Math.round(wallH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = tileW * scale;
    const stripePx = stripeH * scale;

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isAccent = false;
    for (let y = canvas.height - stripePx; y >= -stripePx; y -= stripePx) {
      const tex = isAccent ? texAccent : texWall;
      for (let x = 0; x < canvas.width; x += W) {
        ctx.drawImage(tex.image as CanvasImageSource, x, y, W, stripePx);
        
        const groutPx = 2 * (scale / 304.8);
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = groutPx;
        ctx.strokeRect(x, y, W, stripePx);
      }
      isAccent = !isAccent;
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [texWall, texAccent, wallUrl, accentUrl, wallW, wallH, tileW, stripeH]);

  return map;
}

function HorizontalStripedPlane({
  wallUrl,
  accentUrl,
  position,
  rotation,
  args,
  tileW = 2,
  tileH = 2,
  stripeH = 0.5
}: {
  wallUrl: string | null;
  accentUrl: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number];
  tileW?: number;
  tileH?: number;
  stripeH?: number;
}) {
  const activeTex = useHorizontalStripesTexture(wallUrl, accentUrl, args[0], args[1], tileW, stripeH);
  
  return (
    <mesh position={position} rotation={new THREE.Euler(...rotation)} castShadow receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial 
        map={activeTex}
        color={activeTex ? "#ffffff" : "#dddddd"}
        roughness={TILE_WALL_PBR.roughness}
        metalness={TILE_WALL_PBR.metalness}
        envMapIntensity={TILE_WALL_PBR.envMapIntensity}
        clearcoat={TILE_WALL_PBR.clearcoat}
        clearcoatRoughness={TILE_WALL_PBR.clearcoatRoughness}
      />
    </mesh>
  );
}

function useDiagonalStripesTexture(
  wallUrl: string | null,
  accentUrl: string | null,
  wallW: number,
  wallH: number,
  tileW: number,
  tileH: number
) {
  const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const texWall = useTexture(wallUrl || fallback);
  const texAccent = useTexture(accentUrl || fallback);

  const map = useMemo(() => {
    if (!texWall || !texAccent || (!wallUrl && !accentUrl)) return null;

    const canvas = document.createElement("canvas");
    const scale = 250;
    canvas.width = Math.round(wallW * scale);
    canvas.height = Math.round(wallH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = tileW * scale;
    const H = tileH * scale;

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Rotate canvas around its center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Rotate +45 degrees to match the top-left to bottom-right stripes from the photo
    ctx.rotate(Math.PI / 4); 

    const maxDist = Math.sqrt(canvas.width**2 + canvas.height**2);
    const startX = -maxDist;
    const endX = maxDist;
    const startY = -maxDist;
    const endY = maxDist;

    const groutPx = 2 * (scale / 304.8);

    for (let y = startY; y < endY; y += H) {
      const rowIdx = Math.floor(y / H);
      const isAccent = (rowIdx % 2 !== 0);
      const img = isAccent ? (accentUrl ? texAccent.image : texWall.image) : (wallUrl ? texWall.image : texAccent.image);
      
      const staggerX = (rowIdx % 2 === 0) ? 0 : W / 2;

      for (let x = startX - staggerX; x < endX; x += W) {
        ctx.drawImage(img, x, y, W, H);
        ctx.strokeStyle = "#050505";
        ctx.lineWidth = groutPx;
        ctx.strokeRect(x, y, W, H);
      }
    }
    
    ctx.restore();

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [texWall, texAccent, wallUrl, accentUrl, wallW, wallH, tileW, tileH]);

  return map;
}

function DiagonalStripedPlane({
  wallUrl,
  accentUrl,
  position,
  rotation,
  args,
  tileW = 2,
  tileH = 2
}: {
  wallUrl: string | null;
  accentUrl: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number];
  tileW?: number;
  tileH?: number;
}) {
  const activeTex = useDiagonalStripesTexture(wallUrl, accentUrl, args[0], args[1], tileW, tileH);
  
  return (
    <mesh position={position} rotation={new THREE.Euler(...rotation)} castShadow receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial 
        map={activeTex}
        color={activeTex ? "#ffffff" : "#dddddd"}
        roughness={TILE_WALL_PBR.roughness}
        metalness={TILE_WALL_PBR.metalness}
        envMapIntensity={TILE_WALL_PBR.envMapIntensity}
      />
    </mesh>
  );
}

function TexturedPlane({
  url,
  position,
  rotation,
  args,
  tileW = 2,
  tileH = 2,
  isFloor = false,
  rotationOffset = 0,
  pattern = 'repeat'
}: {
  url: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number];
  tileW?: number;
  tileH?: number;
  isFloor?: boolean;
  rotationOffset?: number;
  pattern?: 'repeat' | 'herringbone' | 'mosaic';
}) {
  const fallbackUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  // Conditionally resolve texture based on pattern style
  const repeatTex = useRepeatingTexture(pattern === 'repeat' ? url : null, args[0] / tileW, args[1] / tileH, tileW, tileH);
  const herringboneTex = useHerringboneTexture(pattern === 'herringbone' ? url : null, args[0], args[1], tileW, tileH);
  const mosaicTex = useMosaicTexture(pattern === 'mosaic' ? url : null, args[0], args[1]);

  const activeTex = useMemo(() => {
    if (pattern === 'herringbone') return herringboneTex;
    if (pattern === 'mosaic') return mosaicTex;
    return repeatTex;
  }, [pattern, repeatTex, herringboneTex, mosaicTex]);

  const pbr = isFloor ? TILE_FLOOR_PBR : TILE_WALL_PBR;

  const finalRotation = useMemo(() => {
    return new THREE.Euler(
      rotation[0],
      rotation[1],
      rotation[2] + rotationOffset
    );
  }, [rotation, rotationOffset]);

  return (
    <mesh position={position} rotation={finalRotation} castShadow receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial 
        map={activeTex}
        color={url ? "#ffffff" : "#dddddd"}
        roughness={pbr.roughness}
        metalness={pbr.metalness}
        envMapIntensity={pbr.envMapIntensity}
        clearcoat={pbr.clearcoat}
        clearcoatRoughness={pbr.clearcoatRoughness}
      />
    </mesh>
  );
}

function LuxuryRoom({
  layoutId,
  wallTileUrl,
  floorTileUrl,
  accentTileUrl,
  tileW = 2,
  tileH = 2
}: Visualizer3DProps) {
  const roomW = 10;
  const roomL = 12;
  const roomH = 10;

  const { gl, scene } = useThree();

  useEffect(() => {
    const handleExport = () => {
      // 1. Create WebGLCubeRenderTarget for the 360 view
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024, {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace,
      });

      // 2. Create CubeCamera at room center (X=5, Y=5, Z=6)
      const cameraPosition = new THREE.Vector3(roomW / 2, roomH / 2, roomL / 2);
      const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
      cubeCamera.position.copy(cameraPosition);
      scene.add(cubeCamera);

      // Render the cubemap from this position
      gl.setRenderTarget(null);
      cubeCamera.update(gl, scene);

      // 3. Create offscreen equirectangular projection target (2:1 aspect ratio)
      const panoW = 2048;
      const panoH = 1024;
      const panoRenderTarget = new THREE.WebGLRenderTarget(panoW, panoH, {
        colorSpace: THREE.SRGBColorSpace,
      });

      const panoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const panoScene = new THREE.Scene();

      // Custom shader mapping spherical coordinates to the Cubemap texture
      const panoMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uCubeMap: { value: cubeRenderTarget.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform samplerCube uCubeMap;
          void main() {
            float phi = vUv.x * 2.0 * 3.14159265;
            float theta = (1.0 - vUv.y) * 3.14159265;
            vec3 dir = vec3(
              sin(theta) * sin(phi),
              cos(theta),
              sin(theta) * cos(phi)
            );
            gl_FragColor = textureCube(uCubeMap, dir);
          }
        `,
        depthWrite: false,
        depthTest: false,
      });

      const panoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), panoMaterial);
      panoScene.add(panoMesh);

      // Render the equirectangular panorama
      gl.setRenderTarget(panoRenderTarget);
      gl.render(panoScene, panoCamera);
      gl.setRenderTarget(null);

      // 4. Read pixels and export as PNG
      const pixels = new Uint8Array(panoW * panoH * 4);
      gl.readRenderTargetPixels(panoRenderTarget, 0, 0, panoW, panoH, pixels);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = panoW;
      exportCanvas.height = panoH;
      const exportCtx = exportCanvas.getContext('2d');
      if (exportCtx) {
        const imgData = exportCtx.createImageData(panoW, panoH);
        // Vertical flip (WebGL coordinates start at bottom-left, Canvas at top-left)
        for (let y = 0; y < panoH; y++) {
          const srcY = panoH - 1 - y;
          for (let x = 0; x < panoW; x++) {
            const srcIdx = (srcY * panoW + x) * 4;
            const destIdx = (y * panoW + x) * 4;
            imgData.data[destIdx] = pixels[srcIdx];
            imgData.data[destIdx + 1] = pixels[srcIdx + 1];
            imgData.data[destIdx + 2] = pixels[srcIdx + 2];
            imgData.data[destIdx + 3] = pixels[srcIdx + 3];
          }
        }
        exportCtx.putImageData(imgData, 0, 0);

        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `bathroom-360-${layoutId}.png`;
        link.href = dataUrl;
        link.click();
      }

      // Cleanup WebGL resources to prevent memory leaks
      scene.remove(cubeCamera);
      cubeRenderTarget.dispose();
      panoRenderTarget.dispose();
      panoMaterial.dispose();
      panoMesh.geometry.dispose();
    };

    const handleExportGLB = () => {
      // Dynamically import GLTFExporter to prevent server-side rendering crashes
      import('three/examples/jsm/exporters/GLTFExporter').then(({ GLTFExporter }) => {
        const exporter = new GLTFExporter();
        
        // Export the scene structure as binary GLB
        exporter.parse(
          scene,
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.download = `bathroom-3D-model-${layoutId}.glb`;
            link.href = URL.createObjectURL(blob);
            link.click();
          },
          (error) => {
            console.error('GLTF Export failed', error);
          },
          { binary: true } // Creates a standalone binary file
        );
      }).catch(err => {
        console.error('Failed to load GLTFExporter', err);
      });
    };

    window.addEventListener('export-360-visualizer', handleExport);
    window.addEventListener('export-glb-visualizer', handleExportGLB);
    return () => {
      window.removeEventListener('export-360-visualizer', handleExport);
      window.removeEventListener('export-glb-visualizer', handleExportGLB);
    };
  }, [gl, scene, layoutId]);

  return (
    <group>
      <Room3D 
        layoutId={layoutId}
        wallTileUrl={wallTileUrl}
        floorTileUrl={floorTileUrl}
        accentTileUrl={accentTileUrl}
        tileW={tileW}
        tileH={tileH}
      />

      <mesh position={[roomW / 2, roomH, roomL / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomL]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Bright, uniform ambient light so the tile image is fully visible */}
      <ambientLight intensity={1.3} />
      
      {/* Soft directional light to provide subtle room depth without glare */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.3} 
        castShadow={false}
      />
    </group>
  );
}

export default function Visualizer3D(props: Visualizer3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 14], fov: 60 }} // Camera start position centered at Y=5
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={["#111111"]} />
      
      <React.Suspense fallback={null}>
        <LuxuryRoom {...props} />
        <BakeShadows />
      </React.Suspense>

      <OrbitControls 
        makeDefault
        target={[5, 5, 6]} // Target center of the room at Y=5, Z=6
        minDistance={2}
        maxDistance={25}    // Allow zooming out much further
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
