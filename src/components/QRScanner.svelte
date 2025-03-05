<script>
  import { onMount, onDestroy } from 'svelte';
  import jsQR from 'jsqr'; // Make sure this package is installed via npm
  
  let videoElement;
  let canvasElement;
  let scanning = false;
  let scannedData = null;
  let error = null;
  let stream = null;
  let jsQRAvailable = false;
  
  onMount(() => {
    // Check if jsQR is available
    jsQRAvailable = typeof jsQR === 'function';
    if (!jsQRAvailable) {
      error = "QR scanner requires the jsQR library. please run 'npm install jsqr'.";
    }
  });
  
  // Function to start the QR code scanner
  async function startScanner() {
    error = null;
    scannedData = null;
    scanning = true;
    
    if (!jsQRAvailable) {
      error = "QR scanner requires the jsQR library. Please run 'npm install jsqr'.";
      scanning = false;
      return;
    }
    
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", true);
        videoElement.play();
        requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      error = "Could not access the camera: " + err.message;
      scanning = false;
    }
  }
  
  // Function to stop the QR code scanner
  function stopScanner() {
    scanning = false;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }
  
  // Function to scan the video for QR codes
  async function scanQRCode() {
    if (!scanning || !videoElement || !canvasElement) return;
    
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      // Draw the video frame to the canvas
      const canvas = canvasElement.getContext("2d");
      canvasElement.height = videoElement.videoHeight;
      canvasElement.width = videoElement.videoWidth;
      canvas.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Try to decode the QR code using the canvas data
      try {
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        
        if (jsQRAvailable) {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });
          
          if (code) {
            scannedData = code.data;
            stopScanner();
            return;
          }
        }
      } catch (err) {
        console.error("QR scan error:", err);
      }
    }
    
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  }
  
  // Clean up when component is destroyed
  onDestroy(() => {
    stopScanner();
  });
</script>

<div class="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
  <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">qr code scanner</h3>
  
  {#if error}
    <div class="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md mb-4">
      {error}
    </div>
  {/if}
  
  {#if scannedData}
    <div class="mb-4">
      <p class="text-gray-700 dark:text-gray-300 mb-2">scanned data:</p>
      <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-md break-all">
        {scannedData}
      </div>
    </div>
    
    <button 
      on:click={() => { scannedData = null; }}
      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700 mr-2"
    >
      clear
    </button>
    
    <button 
      on:click={startScanner}
      class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
    >
      scan again
    </button>
  {:else if scanning}
    <div class="relative mb-4">
      <video bind:this={videoElement} class="w-full h-64 object-cover bg-black rounded-md">
        <track kind="captions" label="QR Scanning" />
      </video>
      <canvas bind:this={canvasElement} class="hidden"></canvas>
      <div class="absolute inset-0 border-2 border-blue-500 dark:border-blue-400 rounded-md pointer-events-none"></div>
    </div>
    
    <button 
      on:click={stopScanner}
      class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors dark:bg-red-600 dark:hover:bg-red-700"
    >
      cancel
    </button>
  {:else}
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      use your device's camera to scan a qr code
    </p>
    
    <button 
      on:click={startScanner}
      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
    >
      start scanner
    </button>
  {/if}
</div>
