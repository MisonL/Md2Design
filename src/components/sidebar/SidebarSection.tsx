import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  rightElement?: React.ReactNode;
}

export const SidebarSection = ({ title, icon, children, defaultOpen = false, rightElement }: SidebarSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black/5 dark:border-white/5 last:border-0">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="opacity-50"
          >
            <ChevronRight size={14} />
          </motion.div>
          {icon}
          <span>{title}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {rightElement}
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-0 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdvancedToggle = ({ children, label = "Advanced Options" }: { children: React.ReactNode, label?: string }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="pt-2">
       <button 
         onClick={() => setShow(!show)}
         className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-80 transition-opacity mb-2 w-full"
       >
         <ChevronRight size={12} className={`transition-transform ${show ? 'rotate-90' : ''}`} />
         {label}
         <div className="h-px bg-current flex-1 opacity-20" />
       </button>
       
       <AnimatePresence initial={false}>
         {show && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2, ease: "easeInOut" }}
             style={{ overflow: 'hidden' }}
           >
             <div className="space-y-4 pt-1 pb-2">
               {children}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};
