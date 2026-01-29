import React, { useEffect, useRef, useState } from 'react';

interface PrintAreaSelectorProps {
  getSVGElement: () => SVGSVGElement | null;
  getTransform: () => { x: number; y: number; k: number };
  onAreaSelected: (bbox: DOMRect) => void;
  onCancel: () => void;
}

const PrintAreaSelector: React.FC<PrintAreaSelectorProps> = ({
  getSVGElement,
  getTransform,
  onAreaSelected,
  onCancel
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [svgBBox, setSvgBBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Obter o SVG elemento dinamicamente
    const svgElement = getSVGElement();
    if (!svgElement) return;

    // 1. Obter o SVG na posição REAL da tela (ignorando sidebar)
    const svgRect = svgElement.getBoundingClientRect();
    setSvgBBox(svgRect);

    // 2. Adicionar listeners
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target !== overlayRef.current) return;

      const rect = overlayRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setStartPos({ x, y });
      setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPos) return;

      const rect = overlayRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
      if (!startPos || !currentPos || !svgBBox) return;

      // 3. CONVERTER coordenadas da overlay para coordenadas do SVG
      const overlayRect = overlayRef.current!.getBoundingClientRect();

      // Calcular bbox relativo ao SVG REAL (já ajustado para posição na tela)
      const minX = Math.min(startPos.x, currentPos.x);
      const minY = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      // 4. Obter transformações atuais das funções passadas pelo App.tsx
      const transform = getTransform();
      const scale = transform.k;
      const transformX = transform.x;
      const transformY = transform.y;

      console.log('🔄 Transformações usadas:', { transformX, transformY, scale });

      // 5. Converter para coordenadas do SVG ORIGINAL
      const svgX = (minX - overlayRect.left) / scale + transformX;
      const svgY = (minY - overlayRect.top) / scale + transformY;
      const svgWidth = width / scale;
      const svgHeight = height / scale;

      // 6. Passar o bbox FINAL (em coordenadas do SVG original)
      const finalBBox = new DOMRect(svgX, svgY, svgWidth, svgHeight);
      console.log('🎯 Área selecionada (coordenadas SVG):', finalBBox);
      onAreaSelected(finalBBox);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (overlay) {
        overlay.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [getSVGElement, getTransform, startPos, currentPos, svgBBox, onAreaSelected, onCancel]);

  // Renderizar a overlay
  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: svgBBox?.top || 0,
        left: svgBBox?.left || 0,
        width: svgBBox?.width || '100%',
        height: svgBBox?.height || '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        cursor: 'crosshair',
        zIndex: 10000,
      }}
    >
      {startPos && currentPos && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(startPos.x, currentPos.x),
            top: Math.min(startPos.y, currentPos.y),
            width: Math.abs(currentPos.x - startPos.x),
            height: Math.abs(currentPos.y - startPos.y),
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            border: '2px dashed #f97316',
          }}
        />
      )}

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        ⬤ Arraste para selecionar a área de impressão
      </div>

      <button
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
      >
        Cancelar (ESC)
      </button>

      {startPos && currentPos && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
        }}>
          {Math.abs(currentPos.x - startPos.x).toFixed(0)} × {Math.abs(currentPos.y - startPos.y).toFixed(0)} px
        </div>
      )}
    </div>
  );
};

export default PrintAreaSelector;