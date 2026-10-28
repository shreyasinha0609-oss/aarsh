import { useEffect, useRef, useState } from 'react';
import './WhatsAppFloatingButton.css';

const STORAGE_KEY = 'aarsh_whatsapp_floating_hidden';

export default function WhatsAppFloatingButton() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const [position, setPosition] = useState({ right: 18, bottom: 110 });
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startRight: 18,
    startBottom: 110,
  });

  useEffect(() => {
    const updatePosition = () => {
      setPosition((current) => ({
        right: Math.min(current.right, Math.max(8, window.innerWidth - 64)),
        bottom: Math.min(current.bottom, Math.max(8, window.innerHeight - 64)),
      }));
    };

    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  if (!visible) return null;

  const handlePointerDown = (event) => {
    if (event.target.closest('.aarsh-wa-close')) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      startRight: position.right,
      startBottom: position.bottom,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      drag.moved = true;
    }

    if (!drag.moved) return;

    const maxRight = Math.max(8, window.innerWidth - 64);
    const maxBottom = Math.max(8, window.innerHeight - 64);

    setPosition({
      right: Math.max(8, Math.min(maxRight, drag.startRight - dx)),
      bottom: Math.max(8, Math.min(maxBottom, drag.startBottom - dy)),
    });
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleWhatsAppClick = (event) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  };

  const hideButton = (event) => {
    event.stopPropagation();
    setVisible(false);

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // The button can still be hidden if storage is unavailable.
    }
  };

  return (
    <div
      className="aarsh-wa-floating"
      style={{
        right: `${position.right}px`,
        bottom: `${position.bottom}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <a
        className="aarsh-wa-link"
        href="https://wa.me/919296943202"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Aarsh Digital on WhatsApp"
        onClick={handleWhatsAppClick}
        draggable="false"
      >
        <img src="/whatsapp.png" alt="WhatsApp" draggable="false" />
      </a>

      <button
        type="button"
        className="aarsh-wa-close"
        onClick={hideButton}
        aria-label="Hide WhatsApp button"
        title="Hide"
      >
        ×
      </button>
    </div>
  );
}