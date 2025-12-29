import type { CardStyle } from '../store';

export const getCardDimensions = (cardStyle: CardStyle) => {
  let width = cardStyle.width || 800;
  let height = cardStyle.height || 600;

  if (cardStyle.aspectRatio !== 'custom' && !cardStyle.autoHeight) {
    const [w, h] = cardStyle.aspectRatio.split(':').map(Number);
    const baseSize = 500; // Base width for preview scaling
    
    // Determine dimensions based on orientation and aspect ratio
    if (cardStyle.orientation === 'portrait') {
      width = baseSize;
      height = width * (h / w); 
      // Swap dimensions if portrait to ensure vertical orientation
      if (w > h) {
         height = width * (w / h);
      } else {
         height = width * (h / w);
      }
    } else {
      // Landscape
      width = baseSize;
      if (w > h) {
        height = width * (h / w);
      } else {
        height = width * (h / w);
      }
    }
    
    // Simplification logic for calculation consistency
    let ratio = w / h;
    if (cardStyle.orientation === 'portrait') {
        if (ratio > 1) ratio = 1 / ratio; 
    } else {
        if (ratio < 1) ratio = 1 / ratio; 
    }
    
    width = baseSize;
    height = baseSize / ratio;
  }
  
  return { width, height };
};
