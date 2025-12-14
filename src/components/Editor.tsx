import { useState, useRef } from 'react';
import { useStore } from '../store';
import { useTranslation } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit3, Bold, Italic, List, Quote, Heading1, Heading2, Link, Image as ImageIcon, Check } from 'lucide-react';
import { htmlToMarkdown } from '../utils/turndown';
import { paginateMarkdown } from '../utils/pagination';

export const Editor = () => {
  const { markdown, setMarkdown, addCardImage, cardStyle } = useStore();
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [showPaginationToast, setShowPaginationToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
    
    setMarkdown(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleImageUpload = (file: File) => {
    const textarea = textareaRef.current;
    // Capture insertion point - default to end if no selection
    const startPos = textarea ? textarea.selectionStart : markdown.length;
    const endPos = textarea ? textarea.selectionEnd : markdown.length;

    // Calculate which card this insertion point belongs to
    // Split text by separator up to the cursor position
    const textBefore = markdown.substring(0, startPos);
    // The separator is "\n---\n". We can match it.
    // The logic in store/preview is `split(/\n---\n/)`.
    // So the number of separators before the cursor determines the index.
    const separators = textBefore.match(/\n---\n/g);
    const targetCardIndex = separators ? separators.length : 0;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const imageUrl = e.target.result as string;
        
        // Add to store (this will create the floating image)
        addCardImage(targetCardIndex, imageUrl);
        
        // Insert spacer syntax to create layout space
        // Using a special image syntax that we'll intercept in Preview
        const spacerMarkdown = `\n![spacer](spacer)\n`;
        
        const newText = markdown.substring(0, startPos) + spacerMarkdown + markdown.substring(endPos);
        setMarkdown(newText);
        
        // Restore focus and move cursor after the inserted spacer
        setTimeout(() => {
          if (textarea) {
            textarea.focus();
            const newCursorPos = startPos + spacerMarkdown.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let handled = false;

    // 1. Handle Images
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }

      const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    // 2. Handle Feishu/HTML Content (Prioritize over plain text if it looks like a doc)
    // We only convert if HTML is present and looks "rich" (simple check)
    // But we also want to allow normal copy paste.
    // Let's use turndown for HTML content if it's not just a single line of text or image.
    if (htmlData && htmlData.trim().length > 0) {
      try {
        const convertedMd = htmlToMarkdown(htmlData);
        
        // If conversion result is valid and not empty
        if (convertedMd && convertedMd.trim().length > 0) {
             e.preventDefault();
             insertText(convertedMd);
             handled = true;
             
             // Check for pagination
             const textarea = textareaRef.current;
             const start = textarea?.selectionStart ?? 0;
             const end = textarea?.selectionEnd ?? 0;
             const newFullText = markdown.substring(0, start) + convertedMd + markdown.substring(end);
             
             // Auto-paginate if content is long
             if (newFullText.length > 500) {
                 const paginated = paginateMarkdown(newFullText, cardStyle);
                 if (paginated !== newFullText) {
                     setMarkdown(paginated);
                     setShowPaginationToast(true);
                     setTimeout(() => setShowPaginationToast(false), 4000);
                 } else {
                     setMarkdown(newFullText);
                 }
             } else {
                 setMarkdown(newFullText);
             }
             return;
        }
      } catch (err) {
        console.error("Failed to convert HTML to Markdown", err);
      }
    }

    // 3. Handle Plain Text (if HTML failed or wasn't present)
    // Also apply pagination check for long plain text
    if (!handled && plainText) {
        // If user pastes a local image file path string? No, browser handles files separately.
        // Just standard text.
        
        // If it's a very short text, just let default behavior happen (it's faster/native)
        // BUT we need to update state.
        // Actually, for consistency and pagination check, let's handle it manually.
        e.preventDefault();
        insertText(plainText);
        
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? 0;
        const end = textarea?.selectionEnd ?? 0;
        const newFullText = markdown.substring(0, start) + plainText + markdown.substring(end);
        
        if (newFullText.length > 500) {
            const paginated = paginateMarkdown(newFullText, cardStyle);
            if (paginated !== newFullText) {
                setMarkdown(paginated);
                setShowPaginationToast(true);
                setTimeout(() => setShowPaginationToast(false), 4000);
            } else {
                setMarkdown(newFullText);
            }
        } else {
             setMarkdown(newFullText);
        }
    }
  };

  

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-6 top-20 bottom-6 w-[400px] glass-panel rounded-2xl flex flex-col z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
                <Edit3 size={16} />
                <span>{t.editor}</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-black/10 dark:border-white/10 overflow-x-auto custom-scrollbar">
              <button onClick={() => insertText('**','**')} title="Bold" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Bold size={16} />
              </button>
              <button onClick={() => insertText('*','*')} title="Italic" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Italic size={16} />
              </button>
              <button onClick={() => insertText('# ')} title="H1" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Heading1 size={16} />
              </button>
              <button onClick={() => insertText('## ')} title="H2" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Heading2 size={16} />
              </button>
              <button onClick={() => insertText('- ')} title="List" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <List size={16} />
              </button>
              <button onClick={() => insertText('> ')} title="Quote" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Quote size={16} />
              </button>
              <button onClick={() => insertText('[', '](url)')} title="Link" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100">
                <Link size={16} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Image"
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors opacity-70 hover:opacity-100"
              >
                <ImageIcon size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  // Reset input value to allow selecting same file again
                  e.target.value = '';
                }}
              />
            </div>
            
            <textarea
              ref={textareaRef}
              className="flex-1 w-full h-full bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed p-4 text-inherit placeholder-inherit/50 custom-scrollbar"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type your markdown here..."
            />
            <div className="p-3 border-t border-black/10 dark:border-white/10 text-center space-y-1.5 bg-black/5 dark:bg-white/5">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 opacity-90">
                {t.editorHint}
              </div>
              <div className="text-xs opacity-60">
                {t.editorHint2}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 glass-panel rounded-full z-40 text-inherit shadow-xl"
          >
            <ChevronRight size={24} />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Pagination Toast */}
      <AnimatePresence>
        {showPaginationToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-black/80 dark:bg-white/90 text-white dark:text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="bg-green-500 rounded-full p-1">
              <Check size={14} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold">已自动分页</span>
                <span className="text-[10px] opacity-80">内容过长，已按页面高度自动切割。可用 "---" 手动调整。</span>
            </div>
            <button 
                onClick={() => setShowPaginationToast(false)}
                className="ml-2 opacity-50 hover:opacity-100 p-1"
            >
                <ChevronLeft className="rotate-[-90deg]" size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
