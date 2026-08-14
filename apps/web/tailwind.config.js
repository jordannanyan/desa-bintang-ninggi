/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Hijau tua — warna umum identitas pemerintahan desa.
        desa: {
          50: '#f0f9f4',
          100: '#dcf0e3',
          200: '#bbe1cb',
          300: '#8dcaa9',
          400: '#57ac81',
          500: '#348f64',
          600: '#22724f',
          700: '#1c5b41',
          800: '#194936',
          900: '#153c2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
