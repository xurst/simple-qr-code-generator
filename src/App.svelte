<script>
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import QRCodeGenerator from './components/QRCodeGenerator.svelte';
  import { onMount } from 'svelte';
  import { darkMode } from './stores/theme.js';
  
  let appReady = false;
  
  onMount(() => {
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        // Only update if no user preference is stored
        if (!localStorage.getItem('theme')) {
          darkMode.set(e.matches);
        }
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } 
      // Safari & older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
      
      // Get initial value
      handleChange(mediaQuery);
      
      // Cleanup function
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
    
    // Mark app as ready after initialization
    appReady = true;
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#1F2937" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#F9FAFB" media="(prefers-color-scheme: light)">
</svelte:head>

<main class="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 px-4 sm:py-8 transition-colors duration-200">
  <div class="max-w-4xl mx-auto">
    <Header />
    <QRCodeGenerator />
    <Footer />
  </div>
</main>

<style>
  :global(body) {
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>