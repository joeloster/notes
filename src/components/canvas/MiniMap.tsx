import React from 'react';
import { Note, ViewState, NOTE_COLOR_MAP } from '@/types/canvas';

interface MiniMapProps {
  notes: Note[];
  view: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (x: number, y: number) => void;
}

const MAP_SIZE = 160;

export const MiniMap: React.FC<MiniMapProps> = ({ notes, view, canvasWidth, canvasHeight, onNavigate }) => {
  if (notes.length === 0) return null;

  // Calculate bounds of all notes
  const bounds = notes.reduce(
    (acc, n) => ({
      minX: Math.min(acc.minX, n.x),
      minY: Math.min(acc.minY, n.y),
      maxX: Math.max(acc.maxX, n.x + n.width),
      maxY: Math.max(acc.maxY, n.y + n.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const padding = 200;
  const worldW = bounds.maxX - bounds.minX + padding * 2;
  const worldH = bounds.maxY - bounds.minY + padding * 2;
  const scale = Math.min(MAP_SIZE / worldW, MAP_SIZE / worldH);
  const mapW = worldW * scale;
  const mapH = worldH * scale;

  // Viewport rect in minimap
  const vpX = (-view.x / view.scale - bounds.minX + padding) * scale;
  const vpY = (-view.y / view.scale - bounds.minY + padding) * scale;
  const vpW = (canvasWidth / view.scale) * scale;
  const vpH = (canvasHeight / view.scale) * scale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = mx / scale + bounds.minX - padding;
    const worldY = my / scale + bounds.minY - padding;
    onNavigate(-worldX * view.scale + canvasWidth / 2, -worldY * view.scale + canvasHeight / 2);
  };

  return (
    <div
      className="fixed bottom-24 right-4 z-50 bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-lg cursor-pointer"
      style={{ width: mapW, height: mapH }}
      onClick={handleClick}
    >
      {notes.map(n => (
        <div
          key={n.id}
          className={`absolute rounded-sm ${NOTE_COLOR_MAP[n.color]}`}
          style={{
            left: (n.x - bounds.minX + padding) * scale,
            top: (n.y - bounds.minY + padding) * scale,
            width: Math.max(4, n.width * scale),
            height: Math.max(3, n.height * scale),
          }}
        />
      ))}
      <div
        className="absolute border-2 border-primary/60 rounded-sm bg-primary/5"
        style={{ left: vpX, top: vpY, width: vpW, height: vpH }}
      />
    </div>
  );
};
