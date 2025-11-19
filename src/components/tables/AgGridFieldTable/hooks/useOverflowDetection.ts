import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect if an element has overflow (for conditional tooltip display)
 */
export const useOverflowDetection = (children: React.ReactNode) => {
  const [hasOverflow, setHasOverflow] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!cellRef.current) return;
      
      const element = cellRef.current;
      
      // New approach: check ALL elements and find the one that ACTUALLY overflows
      // Don't rely on classes or styles - just measure each element
      let hasAnyOverflow = false;
      
      // First, try to find .ellipsisText or .value (most reliable)
      const ellipsisTextElement = element.querySelector('.ellipsisText') as HTMLElement;
      const valueElement = element.querySelector('.value') as HTMLElement;
      
      if (ellipsisTextElement) {
        const scrollWidth = ellipsisTextElement.scrollWidth;
        const clientWidth = ellipsisTextElement.clientWidth;
        hasAnyOverflow = scrollWidth > clientWidth + 1;
      } else if (valueElement) {
        const scrollWidth = valueElement.scrollWidth;
        const clientWidth = valueElement.clientWidth;
        hasAnyOverflow = scrollWidth > clientWidth + 1;
      } else {
        // If we can't find by class, check ALL elements and see if ANY of them overflow
        const allElements = element.querySelectorAll('*');
        let foundOverflow = false;
        
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          
          if (scrollWidth > clientWidth + 1) {
            foundOverflow = true;
            hasAnyOverflow = true;
            break;
          }
        }
        
        if (!foundOverflow) {
          // Check the cell itself as last resort
          const scrollWidth = element.scrollWidth;
          const clientWidth = element.clientWidth;
          hasAnyOverflow = scrollWidth > clientWidth + 1;
        }
      }
      
      setHasOverflow(hasAnyOverflow);
    };

    // Check overflow after render with multiple attempts
    const timeoutId1 = setTimeout(checkOverflow, 0);
    const timeoutId2 = setTimeout(checkOverflow, 10);
    const timeoutId3 = setTimeout(checkOverflow, 50);
    const timeoutId4 = setTimeout(checkOverflow, 100);
    
    // Check on next animation frame
    const rafId1 = requestAnimationFrame(() => {
      checkOverflow();
      requestAnimationFrame(() => {
        checkOverflow();
      });
    });
    
    // Re-check on resize
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    if (cellRef.current) {
      resizeObserver.observe(cellRef.current);
    }
    
    // Also observe mutations to catch when content changes
    const mutationObserver = new MutationObserver(() => {
      checkOverflow();
    });
    if (cellRef.current) {
      mutationObserver.observe(cellRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      cancelAnimationFrame(rafId1);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  return { hasOverflow, cellRef };
};


