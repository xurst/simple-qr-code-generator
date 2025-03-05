<script>
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import QRCodeGenerator from './components/QRCodeGenerator.svelte';
  import { onMount } from 'svelte';
  import { darkMode } from './stores/theme.js';
  
  onMount(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      darkMode.set(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  });
</script>

<main class="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 px-4 transition-colors duration-200">
  <div class="max-w-4xl mx-auto">
    <Header />
    <QRCodeGenerator />
    <Footer />
  </div>
</main>
