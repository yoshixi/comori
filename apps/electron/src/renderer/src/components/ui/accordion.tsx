import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

type AccordionType = 'single' | 'multiple'
type AccordionValue = string | string[] | undefined

interface AccordionContextValue {
  type: AccordionType
  value: AccordionValue
  collapsible: boolean
  toggleValue: (itemValue: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<string | null>(null)

const isItemOpen = (value: AccordionValue, itemValue: string): boolean => {
  if (Array.isArray(value)) {
    return value.includes(itemValue)
  }
  return value === itemValue
}

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: AccordionType
  value?: AccordionValue
  defaultValue?: AccordionValue
  collapsible?: boolean
  onValueChange?: (value: AccordionValue) => void
}

export const Accordion: React.FC<AccordionProps> = ({
  className,
  type = 'single',
  value,
  defaultValue,
  collapsible = false,
  onValueChange,
  children,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<AccordionValue>(() => {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    return type === 'multiple' ? [] : undefined
  })

  const currentValue = value ?? internalValue

  const updateValue = useCallback(
    (nextValue: AccordionValue) => {
      if (value === undefined) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [value, onValueChange]
  )

  const toggleValue = useCallback(
    (itemValue: string) => {
      if (type === 'single') {
        const current = typeof currentValue === 'string' ? currentValue : undefined
        if (current === itemValue) {
          if (collapsible) {
            updateValue(undefined)
          }
          return
        }
        updateValue(itemValue)
        return
      }

      const current = Array.isArray(currentValue) ? currentValue : []
      if (current.includes(itemValue)) {
        updateValue(current.filter((entry) => entry !== itemValue))
        return
      }
      updateValue([...current, itemValue])
    },
    [type, collapsible, currentValue, updateValue]
  )

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      type,
      value: currentValue,
      collapsible,
      toggleValue
    }),
    [type, currentValue, collapsible, toggleValue]
  )

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    const open = ctx ? isItemOpen(ctx.value, value) : false
    return (
      <AccordionItemContext.Provider value={value}>
        <div
          ref={ref}
          data-state={open ? 'open' : 'closed'}
          className={cn('rounded-lg border border-border/70 bg-card/60', className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = 'AccordionItem'

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    const itemValue = useContext(AccordionItemContext)
    if (!ctx) {
      throw new Error('AccordionTrigger must be used within Accordion')
    }
    if (!itemValue) {
      throw new Error('AccordionTrigger must have an AccordionItem parent')
    }

    const open = isItemOpen(ctx.value, itemValue)

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => ctx.toggleValue(itemValue)}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:text-foreground',
          className
        )}
        {...props}
      >
        <span className="flex-1">{children}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open ? 'rotate-180' : ''
          )}
        />
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    const itemValue = useContext(AccordionItemContext)
    if (!ctx) {
      throw new Error('AccordionContent must be used within Accordion')
    }
    if (!itemValue) {
      throw new Error('AccordionContent must have an AccordionItem parent')
    }
    const open = isItemOpen(ctx.value, itemValue)

    return (
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          open ? 'block border-t border-border/40' : 'hidden border-t border-border/40',
          className
        )}
        {...props}
      >
        <div className="px-3 py-3">{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'
