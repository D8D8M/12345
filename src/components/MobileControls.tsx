import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

type MobileSlot = { icon: string; title: string; cd: number };
type MobileBindings = { left: string; right: string; up: string; down: string; jump: string; attack: string; heal: string; interact: string; roll: string; slot1: string; slot2: string; slot3: string; slot4: string };
type Props = { slots: MobileSlot[]; activeSlot: number; paused: boolean; bindings: MobileBindings; scale: number; opacity: number; swapSides: boolean };

const sendKey = (code: string, pressed: boolean) => {
  window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', { code, bubbles: true }));
};

function ControlButton({ code, label, className = '' }: { code: string; label: string; className?: string }) {
  const press = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sendKey(code, true);
  };
  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    sendKey(code, false);
  };

  return <button type="button" aria-label={label} className={`mobile-control-button ${className}`} onPointerDown={press} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{label}</button>;
}

export function MobileControls({ slots, activeSlot, paused, bindings, scale, opacity, swapSides }: Props) {
  const orientationPaused = useRef(false);

  useEffect(() => {
    const portrait = window.matchMedia('(orientation: portrait)');
    const updateOrientation = () => {
      if (portrait.matches && !paused && !orientationPaused.current) {
        orientationPaused.current = true;
        sendKey('Escape', true);
        sendKey('Escape', false);
      } else if (!portrait.matches && orientationPaused.current) {
        orientationPaused.current = false;
        sendKey('Escape', true);
        sendKey('Escape', false);
      }
    };
    updateOrientation();
    portrait.addEventListener('change', updateOrientation);
    return () => portrait.removeEventListener('change', updateOrientation);
  }, [paused]);

  return <div className={`mobile-controls ${swapSides ? 'mobile-controls-swapped' : ''}`} style={{ '--mobile-scale': scale / 100, '--mobile-opacity': opacity / 100 } as CSSProperties} aria-label="Мобильное управление">
    <div className="mobile-rotate-screen" role="status">
      <span className="mobile-rotate-icon">↻</span>
      <strong>Поверните телефон</strong>
      <small>Играть можно в горизонтальном положении</small>
    </div>
    {!paused && <><div className="mobile-dpad">
      <ControlButton code={bindings.up} label="↑" className="mobile-dpad-up" />
      <ControlButton code={bindings.left} label="←" className="mobile-dpad-left" />
      <ControlButton code={bindings.right} label="→" className="mobile-dpad-right" />
      <ControlButton code={bindings.down} label="↓" className="mobile-dpad-down" />
    </div>

    <div className="mobile-weapon-slots" aria-label="Оружие">
      {slots.map((slot, index) => <ControlButton key={index} code={[bindings.slot1, bindings.slot2, bindings.slot3, bindings.slot4][index]} label={slot.icon} className={`mobile-weapon-slot ${activeSlot === index ? 'is-active' : ''} ${slot.cd > 0 ? 'is-cooling' : ''}`} />)}
    </div>

    <div className="mobile-actions">
      <ControlButton code={bindings.jump} label="Прыжок" className="mobile-action mobile-action-jump" />
      <ControlButton code={bindings.heal} label="Лечение" className="mobile-action mobile-action-heal" />
      <ControlButton code={bindings.attack} label="Удар" className="mobile-action mobile-action-attack" />
      <ControlButton code={bindings.roll} label="Рывок" className="mobile-action mobile-action-dash" />
      <ControlButton code={bindings.interact} label="Действие" className="mobile-action mobile-action-interact" />
    </div></>}
  </div>;
}
