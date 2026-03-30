export default defineAppConfig({
  ui: {
    colors: {
      primary: 'yellow',
      neutral: 'zinc'
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
            'bg-white/5 ring-1 ring-white/10 text-white placeholder:text-white/20 focus:ring-1 focus:ring-[#facc15] shadow-none'
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
            'bg-white/5 ring-1 ring-white/10 text-white placeholder:text-white/20 focus:ring-1 focus:ring-[#facc15] shadow-none'
        }
      ]
    },

    checkbox: {
      slots: {
        base: 'border-white/20 bg-white/5 focus:ring-offset-black',
        label: 'text-white/60 font-medium'
      },
      compoundVariants: [
        {
          color: 'primary',
          class: 'checked:bg-[#facc15] checked:border-[#facc15]'
        }
      ]
    },

    modal: {
      slots: {
        overlay: 'bg-black/80 transition-opacity',
        content: 'bg-[#111] ring-1 ring-white/10 shadow-2xl sm:rounded-2xl',
        header: 'pb-0 sm:px-6 sm:pt-6',
        body: 'pt-4 sm:px-6 sm:pb-6',
        footer: 'pt-4 sm:px-6 sm:pb-6',
        title: 'text-white font-bold text-lg',
        description: 'text-white/60 mt-1',
        close: 'text-white/40 hover:text-white hover:bg-white/10 top-4 right-4'
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
