import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss({ config: '../../tailwind.config.cjs' }),
    autoprefixer()
  ]
};