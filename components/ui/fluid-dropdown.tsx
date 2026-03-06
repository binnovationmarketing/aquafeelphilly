
"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown } from "lucide-react"

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function useClickAway(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }
    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

interface DropdownOption {
  id: string
  label: string
  icon?: React.ElementType
  color?: string
}

interface FluidDropdownProps {
  options: DropdownOption[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
  label?: string
}

export function FluidDropdown({ options, selectedId, onSelect, className, label }: FluidDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  const selectedOption = options.find(o => o.id === selectedId) || options[0]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("w-full relative", className)} ref={dropdownRef}>
        {label && <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{label}</label>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
            isOpen ? "bg-slate-800 text-white border-aqua-500/50" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            {selectedOption.icon && <selectedOption.icon size={16} className="text-aqua-400" />}
            {selectedOption.label}
          </span>
          <MotionDiv animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} />
          </MotionDiv>
        </button>

        <AnimatePresence>
          {isOpen && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 z-[100] bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 overflow-hidden"
            >
              <MotionDiv variants={containerVariants} initial="hidden" animate="visible" className="relative">
                {options.map((option) => (
                  <MotionButton
                    key={option.id}
                    variants={itemVariants}
                    onClick={() => {
                      onSelect(option.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "relative flex w-full items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors z-10",
                      selectedId === option.id ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {selectedId === option.id && (
                      <MotionDiv
                        layoutId="active-bg"
                        className="absolute inset-0 bg-white/5 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {option.icon && <option.icon size={16} className={selectedId === option.id ? "text-aqua-400" : "text-slate-500"} />}
                    {option.label}
                  </MotionButton>
                ))}
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
