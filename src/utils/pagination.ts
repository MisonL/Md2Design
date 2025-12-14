import type { CardStyle } from '../store';

/**
 * Estimates the height of a markdown block based on current card styles.
 * This is a heuristic approach to avoid heavy DOM rendering for measurement.
 */
const estimateBlockHeight = (block: string, style: CardStyle, contentWidth: number): number => {
  const fontSize = style.fontSize;
  const lineHeight = 1.6; // Approximation of leading-relaxed
  const charWidthAvg = fontSize * 0.6; // Average character width
  const charsPerLine = Math.floor(contentWidth / charWidthAvg);

  // Headers
  if (block.startsWith('# ')) return fontSize * 2 * 1.3 + 20; // H1
  if (block.startsWith('## ')) return fontSize * 1.5 * 1.3 + 16; // H2
  if (block.startsWith('### ')) return fontSize * 1.25 * 1.3 + 12; // H3
  
  // Quote
  if (block.startsWith('> ')) {
    const text = block.replace(/^> /, '');
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * fontSize * lineHeight + 20; // + padding
  }

  // List
  if (block.match(/^[-*] /) || block.match(/^\d+\. /)) {
    // Each list item might wrap
    const totalLines = block.split('\n').reduce((acc, line) => {
      const text = line.replace(/^[-*] |\d+\. /, '');
      return acc + Math.max(1, Math.ceil(text.length / charsPerLine));
    }, 0);
    return totalLines * fontSize * lineHeight + 10;
  }

  // Image (Inline markdown image, not floating)
  if (block.match(/!\[.*?\]\(.*?\)/)) {
    return 250; // Conservative estimate for an inline image
  }

  // Spacer
  if (block.includes('![spacer]')) {
    return 200; // Fixed spacer height
  }

  // Separator
  if (block.trim() === '---') {
    return 0; // Will be handled by splitter
  }

  // Regular Paragraph
  // Consider that CJK characters are wider than Latin on average, or just be more conservative.
  // charWidthAvg = 0.6 * fontSize is a bit optimistic for English, but for CJK it's usually 1.0 * fontSize.
  // Let's use a mixed heuristic or just be safer.
  const isCJK = /[\u4e00-\u9fa5]/.test(block);
  const adjustedCharWidth = isCJK ? fontSize * 1.1 : fontSize * 0.6;
  const adjustedCharsPerLine = Math.floor(contentWidth / adjustedCharWidth);

  const lines = Math.ceil(block.length / adjustedCharsPerLine);
  return lines * fontSize * lineHeight + 16; // + paragraph gap
};

export const paginateMarkdown = (markdown: string, style: CardStyle): string => {
  // 1. Calculate available height
  // Height - Padding*2 - (Watermark/PageNum safety if needed)
  // Let's reserve 20% bottom space for safety/footer to avoid cutoff
  const contentWidth = style.width - (style.padding * 2);
  const maxContentHeight = (style.height - (style.padding * 2)) * 0.8; 

  // 2. Split by double newline to get blocks
  // Preserve the delimiters to reconstruct later
  const rawBlocks = markdown.split(/\n\n+/);
  
  let pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentHeight = 0;

  for (const block of rawBlocks) {
    // If manual separator exists in block (edge case), respect it?
    // The editor uses \n---\n.
    if (block.includes('\n---\n') || block === '---') {
        // Force break
        // Actually, if the user pastes content with '---', we should probably keep it or split there.
        // Let's assume input doesn't have '---' for auto-pagination or we treat it as a hard break.
        // Simplified: Treat '---' as a hard break block.
        const parts = block.split(/\n---\n/);
        for (let i = 0; i < parts.length; i++) {
            const subBlock = parts[i];
            const h = estimateBlockHeight(subBlock, style, contentWidth);
            
            if (currentHeight + h > maxContentHeight && currentPageBlocks.length > 0) {
                pages.push(currentPageBlocks.join('\n\n'));
                currentPageBlocks = [subBlock];
                currentHeight = h;
            } else {
                currentPageBlocks.push(subBlock);
                currentHeight += h;
            }
            
            // If not the last part, it means we hit a '---', so push page
            if (i < parts.length - 1) {
                pages.push(currentPageBlocks.join('\n\n'));
                currentPageBlocks = [];
                currentHeight = 0;
            }
        }
        continue;
    }

    const height = estimateBlockHeight(block, style, contentWidth);

    if (currentHeight + height > maxContentHeight && currentPageBlocks.length > 0) {
      // Page full, push current blocks to pages
      pages.push(currentPageBlocks.join('\n\n'));
      // Start new page with current block
      currentPageBlocks = [block];
      currentHeight = height;
    } else {
      currentPageBlocks.push(block);
      currentHeight += height;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks.join('\n\n'));
  }

  return pages.join('\n\n---\n\n');
};
