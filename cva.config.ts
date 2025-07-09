import type { Config } from 'class-variance-authority/config'

// Disable lazy loading so tailwind-merge is bundled directly into each file
export default <Config>{
  cva: {
    lazy: false,
  },
}; 