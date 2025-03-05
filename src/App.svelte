<script>
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import QRCodeGenerator from './components/QRCodeGenerator.svelte';
  import QRScanner from './components/QRScanner.svelte';
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
    <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-100 text-sm">
      <p><strong>Note:</strong> to use the qr scanner feature, run <code class="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded">npm install jsqr</code> after cloning this repository.</p>
    </div>
    <QRCodeGenerator />
    <QRScanner />
    <Footer />
  </div>
</main>
