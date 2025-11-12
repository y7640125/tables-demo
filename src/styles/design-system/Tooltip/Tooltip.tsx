import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

/**
 * Tooltip component that shows content on hover or focus.
 * 
 * Features:
 * - Shows tooltip on mouse hover and keyboard focus
 * - Hides on mouse leave / blur
 * - Positioned above the element by default with small offset
 * - Handles long text with max-width and wrapping
 * - Accessible with proper ARIA attributes
 * - Works in RTL layouts
 */
export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!isVisible) {
      setIsPositioned(false);
      return;
    }
    
    if (!wrapperRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!wrapperRef.current || !tooltipRef.current) return;
      
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;
      
      // Position tooltip above the element, centered horizontally
      let top = wrapperRect.top - tooltipRect.height - padding;
      let left = wrapperRect.left + (wrapperRect.width / 2) - (tooltipRect.width / 2);
      
      // If tooltip would go above viewport, show below instead
      if (top < padding) {
        top = wrapperRect.bottom + padding;
      }
      
      // Ensure tooltip stays within viewport bounds
      if (left < padding) {
        left = padding;
      } else if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      
      setPosition({ top, left });
      setIsPositioned(true);
    };

    // Use double requestAnimationFrame to ensure portal-rendered tooltip is in DOM
    // First RAF: React renders the portal
    // Second RAF: Tooltip is in document.body and we can measure it
    let rafId1: number;
    const rafId2 = requestAnimationFrame(() => {
      rafId1 = requestAnimationFrame(() => {
        updatePosition();
      });
    });
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(rafId2);
      if (rafId1) cancelAnimationFrame(rafId1);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={isVisible ? tooltipId.current : undefined}
    >
      {children}
      {isVisible && content && createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          className={styles.tooltip}
          role="tooltip"
          style={{
            position: 'fixed',
            top: isPositioned ? position.top : -9999,
            left: isPositioned ? position.left : -9999,
            zIndex: 10000,
            visibility: isPositioned ? 'visible' : 'hidden',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}

