import { useState, useEffect } from 'react';

export const useZoomDetector = () => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const calculateZoom = () => {
      const ratio = window.outerWidth / window.innerWidth;
      setZoom(ratio);
    };

    calculateZoom();
    window.addEventListener('resize', calculateZoom);

    return () => {
      window.removeEventListener('resize', calculateZoom);
    };
  }, []);

  return zoom;
};
