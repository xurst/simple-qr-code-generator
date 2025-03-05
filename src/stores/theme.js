import { writable } from 'svelte/store';

// Check if dark mode is preferred in the system or was previously set
const prefersDarkMode = () => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Create the store
const createThemeStore = () => {
  // Initialize with system preference if client-side
  const initialValue = typeof window !== 'undefined' ? prefersDarkMode() : false;
  const { subscribe, set, update } = writable(initialValue);

  return {
    subscribe,
    toggle: () => {
      update(isDark => {
        const newValue = !isDark;
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', newValue ? 'dark' : 'light');
        }
        return newValue;
      });
    },
    set: (value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', value ? 'dark' : 'light');
      }
      set(value);
    }
  };
};

export const darkMode = createThemeStore();
