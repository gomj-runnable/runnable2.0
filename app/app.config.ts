export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'slate'
    },

    input: {
      slots: {
        root: 'relative w-full',
        base: 'text-base disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 rounded-lg'
      },
      defaultVariants: {
        size: 'lg',
        color: 'white',
        variant: 'outline'
      },
      compoundVariants: [
        {
          color: 'white',
          variant: 'outline',
          class:
            'bg-[var(--color-surface-soft)] ring-1 ring-[var(--color-border-subtle)] text-[var(--color-text-inverse)] placeholder:text-[var(--color-text-inverse-28)] focus:ring-1 focus:ring-[var(--color-focus-ring-soft)] shadow-none'
        }
      ]
    },

    textarea: {
      slots: {
        root: 'w-full',
        base: 'text-lg disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 rounded-lg'
      },
      defaultVariants: {
        size: 'lg',
        color: 'white',
        variant: 'outline'
      },
      compoundVariants: [
        {
          color: 'white',
          variant: 'outline',
          class:
            'bg-[var(--color-surface-soft)] ring-1 ring-[var(--color-border-subtle)] text-[var(--color-text-inverse)] placeholder:text-[var(--color-text-inverse-28)] focus:ring-1 focus:ring-[var(--color-focus-ring-soft)] shadow-none'
        }
      ]
    },

    checkbox: {
      slots: {
        base: 'border-[var(--color-border-default)] bg-[var(--color-surface-soft)] focus:ring-offset-[var(--color-surface-overlay)]',
        label: 'text-[var(--color-text-inverse-60)] font-medium'
      },
      compoundVariants: [
        {
          color: 'primary',
          class: 'checked:bg-[var(--color-brand-primary)] checked:border-[var(--color-brand-primary)]'
        }
      ]
    },

    modal: {
      slots: {
        overlay: 'bg-[var(--color-surface-overlay)] transition-opacity',
        content: 'bg-[var(--color-surface-elevated)] ring-1 ring-[var(--color-border-subtle)] shadow-2xl sm:rounded-2xl',
        header: 'pb-0 sm:px-6 sm:pt-6',
        body: 'pt-4 sm:px-6 sm:pb-6',
        footer: 'pt-4 sm:px-6 sm:pb-6',
        title: 'text-[var(--color-text-inverse)] font-bold text-lg',
        description: 'text-[var(--color-text-inverse-60)] mt-1',
        close: 'text-[var(--color-text-inverse-40)] hover:text-[var(--color-text-inverse)] hover:bg-[var(--color-surface-soft-hover)] top-4 right-4'
      }
    },

    authForm: {
      slots: {
        password: `ring-1 ring-gray-300 rounded-lg !text-black/80`,
        input: `ring-1 ring-gray-300 rounded-lg !text-black/80`
      }
    }
  }
})
