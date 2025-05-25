"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Position {
  x: number;
  y: number;
}

interface Obstacle {
  x: number;
  y: number;
}

interface StairTile {
  x: number;
  y: number;
  isRailing?: boolean; // 階段の手すり用
}

interface Staircase {
  tiles: StairTile[];
  targetFloor: number;
  entry: Position;   // この階で階段に入る位置
  exit: Position;    // targetFloorで出る位置
}

interface FloorLayout {
  obstacles: Obstacle[];
  staircases: Staircase[];
  playerStart: Position;
  isOutside?: boolean; // 外部環境かどうかのフラグ
}

// グリッドサイズをさらに拡大
const GRID_WIDTH = 60;
const GRID_HEIGHT = 50;

// 家の位置とサイズd
const HOUSE_START_X = 15;
const HOUSE_START_Y = 10;
const HOUSE_WIDTH = 30;
const HOUSE_HEIGHT = 24;

// 家の内部と外部を含むレイアウト
const FLOOR_LAYOUTS: Record<number | string, FloorLayout> = {
  1: {
    obstacles: [
      // 家の外壁のみ（内部の壁構造は維持）
      // 左壁
      ...Array.from({ length: HOUSE_HEIGHT }, (_, i) => ({ x: HOUSE_START_X, y: HOUSE_START_Y + i })),
      // 右壁
      ...Array.from({ length: HOUSE_HEIGHT }, (_, i) => ({ x: HOUSE_START_X + HOUSE_WIDTH - 1, y: HOUSE_START_Y + i })),
      // 上壁（出入口あり - 中央部分の壁を除外）
      ...Array.from({ length: HOUSE_WIDTH - 5 }, (_, i) => ({ x: HOUSE_START_X + i , y: HOUSE_START_Y })), // 左側部分
      ...Array.from({ length: 2 }, (_, i) => ({ x: HOUSE_START_X + i + 27, y: HOUSE_START_Y })), // 右側部分
      // 下壁（出入口あり - 中央部分の壁を除外）
      ...Array.from({ length: HOUSE_WIDTH }, (_, i) => ({ x: HOUSE_START_X + i, y: HOUSE_START_Y + HOUSE_HEIGHT - 1 })), // 左側部分
      
      // 内部の構造（写真1に基づく）
      ...Array.from({ length: 22 }, (_, i) => ({ x: HOUSE_START_X + i, y: HOUSE_START_Y + 6 })), // 上部横壁
      ...Array.from({ length: 22 }, (_, i) => ({ x: HOUSE_START_X + i, y: HOUSE_START_Y + 12 })), // 中部横壁
      ...Array.from({ length: 22 }, (_, i) => ({ x: HOUSE_START_X + i, y: HOUSE_START_Y + 18 })), // 下部横壁
      
      // 縦壁
      ...Array.from({ length: 4 }, (_, i) => ({ x: HOUSE_START_X + 22, y: HOUSE_START_Y + i + 6 })),
      ...Array.from({ length: 4 }, (_, i) => ({ x: HOUSE_START_X + 22, y: HOUSE_START_Y + i + 12 })),
      ...Array.from({ length: 3 }, (_, i) => ({ x: HOUSE_START_X + 22, y: HOUSE_START_Y + i + 18 })),

      // 階段の壁（階段の下部に壁を追加）
      ...Array.from({ length: 7 }, (_, i) => ({ x: HOUSE_START_X + 16 + i, y: HOUSE_START_Y + 3 })),
      { x: HOUSE_START_X + 22, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 22, y: HOUSE_START_Y + 2 }, // 階段の右側の壁
      
      // 外の環境要素
      // 池（家の上部）
      ...Array.from({ length: 10 }, (_, i) => ({ x: 5 + i, y: 5 })),
      ...Array.from({ length: 10 }, (_, i) => ({ x: 5 + i, y: 8 })),
      ...Array.from({ length: 4 }, (_, i) => ({ x: 5, y: 5 + i })),
      ...Array.from({ length: 4 }, (_, i) => ({ x: 14, y: 5 + i })),
      
      // 木々（点在させる）
      { x: 5, y: 20 }, { x: 8, y: 22 }, { x: 10, y: 18 },
      { x: 50, y: 15 }, { x: 52, y: 20 }, { x: 48, y: 25 },
      { x: 30, y: 40 }, { x: 35, y: 42 }, { x: 20, y: 45 },
      
      // 石（小さな障害物）
      { x: 25, y: 5 }, { x: 55, y: 12 },
      { x: 8, y: 35 }, { x: 45, y: 45 }, { x: 53, y: 38 },
    ],
    staircases: [
      {
        tiles: [
          { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 2 }, 
          { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 2 },
          // 手すり
          { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 0, isRailing: true },
        ],
        targetFloor: 2,
        entry: { x: HOUSE_START_X + 15, y: HOUSE_START_Y + 2 }, // 1階で階段に入る位置
        exit: { x: HOUSE_START_X + 15, y: HOUSE_START_Y + 2 },  // 2階で出る位置
      }
    ],
    playerStart: { x: HOUSE_START_X + 5, y: HOUSE_START_Y + 20 },
    isOutside: true
  },
  2: {
    obstacles: [
      // 外壁
      ...Array.from({ length: HOUSE_HEIGHT }, (_, i) => ({ x: HOUSE_START_X, y: HOUSE_START_Y + i })), // 左壁
      ...Array.from({ length: HOUSE_HEIGHT }, (_, i) => ({ x: HOUSE_START_X + HOUSE_WIDTH - 1, y: HOUSE_START_Y + i })), // 右壁
      ...Array.from({ length: HOUSE_WIDTH - 2 }, (_, i) => ({ x: HOUSE_START_X + i + 1, y: HOUSE_START_Y })), // 上壁
      ...Array.from({ length: HOUSE_WIDTH - 2 }, (_, i) => ({ x: HOUSE_START_X + i + 1, y: HOUSE_START_Y + HOUSE_HEIGHT - 1 })), // 下壁
      
      // 上部の縦壁
      ...Array.from({ length: 12 }, (_, i) => ({ x: HOUSE_START_X + 15, y: HOUSE_START_Y + i })),
      
      // 右側の部屋（入口を作る）
      ...Array.from({ length: 3 }, (_, i) => ({ x: HOUSE_START_X + 20 + i, y: HOUSE_START_Y + 10 })), // 上壁（入口あり）
      { x: HOUSE_START_X + 25, y: HOUSE_START_Y + 10 }, { x: HOUSE_START_X + 26, y: HOUSE_START_Y + 10 }, 
      { x: HOUSE_START_X + 27, y: HOUSE_START_Y + 10 }, { x: HOUSE_START_X + 28, y: HOUSE_START_Y + 10 },
      ...Array.from({ length: 10 }, (_, i) => ({ x: HOUSE_START_X + 20, y: HOUSE_START_Y + 11 + i })), // 左壁
      ...Array.from({ length: 6 }, (_, i) => ({ x: HOUSE_START_X + 21 + i, y: HOUSE_START_Y + 17 })), // 下壁
      
      // 下部の水平線（途切れている壁）
      // 左側
      ...Array.from({ length: 7 }, (_, i) => ({ x: HOUSE_START_X + i + 1, y: HOUSE_START_Y + 10 })),
      ...Array.from({ length: 7 }, (_, i) => ({ x: HOUSE_START_X + i + 1, y: HOUSE_START_Y + 14 })),
      
      // 右側
      ...Array.from({ length: 7 }, (_, i) => ({ x: HOUSE_START_X + i + 10, y: HOUSE_START_Y + 10 })),
      
      // 右下の長い壁（入口あり）
      ...Array.from({ length: 9 }, (_, i) => ({ x: HOUSE_START_X + i + 7, y: HOUSE_START_Y + 20 })),
      ...Array.from({ length: 3 }, (_, i) => ({ x: HOUSE_START_X + i + 18, y: HOUSE_START_Y + 20 })),
      ...Array.from({ length: 6 }, (_, i) => ({ x: HOUSE_START_X + 7, y: HOUSE_START_Y + 15 + i })), // 左壁

      // 階段の壁
      ...Array.from({ length: 7 }, (_, i) => ({ x: HOUSE_START_X + 15 + i, y: HOUSE_START_Y + 3 })),
      { x: HOUSE_START_X + 15, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 15, y: HOUSE_START_Y + 2 }, // 階段の左側の壁
    ],
    staircases: [
      {
        tiles: [
          { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 2 }, 
          { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 2 },
          { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 1 }, { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 2 },
          // 手すり
          { x: HOUSE_START_X + 16, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 17, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 19, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 20, y: HOUSE_START_Y + 0, isRailing: true },
          { x: HOUSE_START_X + 21, y: HOUSE_START_Y + 0, isRailing: true },
        ],
        targetFloor: 1,
        entry: { x: HOUSE_START_X + 22, y: HOUSE_START_Y + 2 }, // 2階で階段に入る位置
        exit: { x: HOUSE_START_X + 22, y: HOUSE_START_Y + 2 },  // 1階で出る位置
      }
    ],
    playerStart: { x: HOUSE_START_X + 18, y: HOUSE_START_Y + 4 }
  }
};

const World: React.FC = () => {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [playerPosition, setPlayerPosition] = useState<Position>(
    FLOOR_LAYOUTS[1].playerStart
  );

  const currentLayout = FLOOR_LAYOUTS[currentFloor];
  
  // 視野サイズを設定（プレイヤーの周りだけを表示）
  const VIEW_RANGE = 24; // プレイヤーの周囲に表示する範囲
  
  // 視野の起点を計算
  const viewStartX = Math.max(0, playerPosition.x - VIEW_RANGE);
  const viewStartY = Math.max(0, playerPosition.y - VIEW_RANGE);

  const handleKeyDown = (e: KeyboardEvent) => {
    const newPosition = { ...playerPosition };

    switch (e.key.toLowerCase()) {
      case 'w':
        newPosition.y = Math.max(0, playerPosition.y - 1);
        break;
      case 's':
        newPosition.y = Math.min(GRID_HEIGHT - 1, playerPosition.y + 1);
        break;
      case 'a':
        newPosition.x = Math.max(0, playerPosition.x - 1);
        break;
      case 'd':
        newPosition.x = Math.min(GRID_WIDTH - 1, playerPosition.x + 1);
        break;
    }

    // 障害物との衝突チェック
    const isObstacle = currentLayout.obstacles.some(
      (obs) => obs.x === newPosition.x && obs.y === newPosition.y
    );

    // 階段に乗ったかチェック
    const staircase = currentLayout.staircases.find(stair =>
      stair.tiles.some(tile => tile.x === newPosition.x && tile.y === newPosition.y && !tile.isRailing)
    );

    if (staircase) {
      // 次の階の階段出口に移動
      setCurrentFloor(staircase.targetFloor);
      setPlayerPosition(
        FLOOR_LAYOUTS[staircase.targetFloor].staircases[0].exit
      );
      return;
    }

    if (!isObstacle) {
      setPlayerPosition(newPosition);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerPosition, currentFloor]);

  // タイルの種類を判定する関数
  const getTileType = (x: number, y: number) => {
    // 外部環境の色を変える
    if (currentLayout.isOutside && 
        (x < HOUSE_START_X || x >= HOUSE_START_X + HOUSE_WIDTH || 
         y < HOUSE_START_Y || y >= HOUSE_START_Y + HOUSE_HEIGHT)) {
      // 家の外側のタイル
      return 'bg-green-300'; // 草原
    }
    
    return 'bg-gray-200'; // 家の中のデフォルトタイル
  };

  return (
    <div className="flex flex-row items-start justify-center gap-8 p-4">
      {/* 左側の情報パネル */}
      <div className="mt-4 text-gray-600 w-52 bg-white rounded-lg shadow-md p-4">
        <div className="mb-4 text-lg font-bold">
          {currentFloor === 1 ? "1階 & 外部エリア" : `フロア ${currentFloor}`}
        </div>
        
        <div className="mb-3">
          <p className="font-bold mb-1">操作方法:</p>
          <p>WASDキーで移動</p>
        </div>
        
        <div className="mb-3">
          <p className="font-bold mb-1">凡例:</p>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-blue-500 mr-2"></div>
            <p>プレイヤー</p>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-gray-800 mr-2"></div>
            <p>壁/木/障害物</p>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-amber-500 mr-2"></div>
            <p>階段</p>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-green-300 mr-2"></div>
            <p>外部エリア</p>
          </div>
        </div>
        
        <div>
          <p className="font-bold mb-1">ステータス:</p>
          <p>現在: {currentFloor === 1 ? "1階 & 外部" : `${currentFloor}階`}</p>
          <p>座標: X: {playerPosition.x}, Y: {playerPosition.y}</p>
        </div>
      </div>

      {/* メインのゲーム画面 */}
      <div>
        <div className={`grid gap-0 w-[750px] h-[600px] border-2 border-gray-300`} 
             style={{gridTemplateColumns: `repeat(${VIEW_RANGE * 2}, 1fr)`, gridTemplateRows: `repeat(${VIEW_RANGE * 2}, 1fr)`}}>
          {Array.from({ length: VIEW_RANGE * 2 }).map((_, relY) => {
            const y = viewStartY + relY;
            
            return Array.from({ length: VIEW_RANGE * 2 }).map((_, relX) => {
              const x = viewStartX + relX;
              
              // 範囲外の場合は黒タイルを表示
              if (x >= GRID_WIDTH || y >= GRID_HEIGHT || x < 0 || y < 0) {
                return (
                  <div key={`${relY}-${relX}`} className="w-[18px] h-[15px] bg-black" />
                );
              }
              
              const isObstacle = currentLayout.obstacles.some(
                (obs) => obs.x === x && obs.y === y
              );
              const isPlayer = playerPosition.x === x && playerPosition.y === y;
              
              const stairTile = currentLayout.staircases.flatMap(stair => 
                stair.tiles.map(tile => tile)
              ).find(tile => tile.x === x && tile.y === y);
              
              const isStair = !!stairTile && !stairTile.isRailing;
              const isRailing = !!stairTile?.isRailing;
              
              // 屋内か屋外かでタイルの色を変える
              const tileType = getTileType(x, y);

              return (
                <div
                  key={`${relY}-${relX}`}
                  className={`w-[18px] h-[15px] ${
                    isObstacle
                      ? 'bg-gray-800'
                      : isPlayer
                      ? 'bg-blue-500'
                      : isStair
                      ? 'bg-amber-500'
                      : isRailing
                      ? 'bg-amber-700'
                      : tileType
                  }`}
                />
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default World;