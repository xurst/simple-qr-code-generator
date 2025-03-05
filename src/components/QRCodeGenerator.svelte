<script>
  import QRCode from 'qrcode';
  import { onMount } from 'svelte';
  
  // QR code types and their formats
  const types = [
    { id: 'url', label: 'website url', placeholder: 'https://example.com', format: val => !val.match(/^[a-zA-Z]+:\/\//) ? `https://${val}` : val },
    { id: 'phone', label: 'phone number', placeholder: '+1234567890', format: val => `tel:${val}` },
    { id: 'email', label: 'email address', placeholder: 'example@email.com', format: val => `mailto:${val}` },
    { id: 'text', label: 'plain text', placeholder: 'your text here', format: val => val },
    { id: 'wifi', label: 'wifi network', placeholder: '', format: (_, params) => `WIFI:S:${params.ssid};T:${params.encryption};P:${params.password};;` },
    { id: 'geo', label: 'geographic location', placeholder: '', format: (_, params) => `geo:${params.latitude},${params.longitude}` },
    { id: 'contact', label: 'contact information', placeholder: '', format: (_, params) => {
      return `BEGIN:VCARD\nVERSION:3.0\nN:${params.lastName};${params.firstName}\nFN:${params.firstName} ${params.lastName}\nTEL:${params.phone}\nEMAIL:${params.email}\nEND:VCARD`;
    }},
    { id: 'event', label: 'calendar event', placeholder: '', format: (_, params) => {
      // Format dates properly for iCalendar format
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const start = formatDate(params.startDate);
      const end = formatDate(params.endDate);
      
      return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//simple-qr-code-generator//EN
BEGIN:VEVENT
SUMMARY:${params.title || 'Event'}
LOCATION:${params.location || ''}
DESCRIPTION:${params.description || ''}
DTSTART:${start}
DTEND:${end}
END:VEVENT
END:VCALENDAR`;
    }}
  ];
  
  // Settings
  let selectedType = types[0];
  let inputValue = '';
  let qrDataUrl = '';
  let errorCorrectionLevel = 'M';
  let darkColor = '#000000';
  let lightColor = '#ffffff';
  let scale = 6;
  let margin = 2;
  
  // Additional parameters for complex QR types
  let additionalParams = {
    wifi: { ssid: '', password: '', encryption: 'WPA' },
    geo: { latitude: '', longitude: '' },
    contact: { firstName: '', lastName: '', phone: '', email: '' },
    event: { title: '', location: '', description: '', startDate: '', endDate: '' }
  };

  // Storage for recent QR codes and favorites
  let recentQrCodes = [];
  let favoriteQrCodes = [];
  let showHistory = false;
  let showFavorites = false;
  
  // Format the QR data based on the selected type
  $: formattedData = inputValue && ['url', 'phone', 'email', 'text'].includes(selectedType.id)
    ? selectedType.format(inputValue)
    : selectedType.format('', additionalParams[selectedType.id]);

  // Generate a user-friendly title based on QR type and content
  function generateTitle() {
    if (selectedType.id === 'url') {
      try {
        const url = new URL(formattedData);
        return `URL: ${url.hostname}`;
      } catch (e) {
        return `URL: ${formattedData.substring(0, 30)}`;
      }
    } else if (selectedType.id === 'phone') {
      return `phone: ${formattedData.replace('tel:', '')}`;
    } else if (selectedType.id === 'email') {
      return `email: ${formattedData.replace('mailto:', '')}`;
    } else if (selectedType.id === 'wifi') {
      return `wifi: ${additionalParams.wifi.ssid}`;
    } else if (selectedType.id === 'contact') {
      return `contact: ${additionalParams.contact.firstName} ${additionalParams.contact.lastName}`;
    } else if (selectedType.id === 'event') {
      return `event: ${additionalParams.event.title}`;
    } else if (selectedType.id === 'geo') {
      return `location: ${additionalParams.geo.latitude},${additionalParams.geo.longitude}`;
    } else {
      return formattedData.substring(0, 30) + (formattedData.length > 30 ? '...' : '');
    }
  }

  // Function to generate the QR code
  async function generateQRCode() {
    // Validate input - prevent empty URLs
    if (!formattedData) return;
    if (selectedType.id === 'url' && formattedData === 'https://') return;
    
    try {
      // Basic options that work with standard qrcode library
      const options = {
        errorCorrectionLevel,
        margin: parseInt(margin),
        scale: parseInt(scale),
        color: {
          dark: darkColor,
          light: lightColor
        }
      };
      
      // Generate the QR code
      qrDataUrl = await QRCode.toDataURL(formattedData, options);
      
      // Add to recent QR codes if there's meaningful content
      if (qrDataUrl && formattedData) {
        // Create QR code entry
        const newQrCode = {
          id: Date.now().toString(),
          type: selectedType.id,
          data: formattedData,
          imageUrl: qrDataUrl,
          title: generateTitle(),
          createdAt: new Date().toISOString(),
          isFavorite: false
        };
        
        // Add to recent QR codes without duplication prevention
        recentQrCodes = [newQrCode, ...recentQrCodes].slice(0, 10);
        localStorage.setItem('recentQrCodes', JSON.stringify(recentQrCodes));
      }
    } catch (err) {
      console.error('error generating qr code:', err);
    }
  }
  
  // Function to copy the QR data to clipboard
  function copyData() {
    if (!formattedData) return;
    
    navigator.clipboard.writeText(formattedData)
      .then(() => {
        alert('data copied to clipboard');
      })
      .catch(err => {
        console.error('could not copy text:', err);
      });
  }
  
  // Function to download the QR code as a PNG image
  function downloadQRCode() {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Function to handle type change
  function handleTypeChange(event) {
    selectedType = types.find(type => type.id === event.target.value);
  }

  // Load a saved QR code
  function loadQrCode(qrCode) {
    // Find the type
    selectedType = types.find(type => type.id === qrCode.type);
    
    // Set the value based on the QR code type
    if (['url', 'phone', 'email', 'text'].includes(qrCode.type)) {
      // Simple types
      if (qrCode.type === 'url') {
        inputValue = qrCode.data.replace(/^https?:\/\//, '');
      } else if (qrCode.type === 'phone') {
        inputValue = qrCode.data.replace('tel:', '');
      } else if (qrCode.type === 'email') {
        inputValue = qrCode.data.replace('mailto:', '');
      } else {
        inputValue = qrCode.data;
      }
    } else {
      // Complex types
      inputValue = '';
      
      if (qrCode.type === 'wifi') {
        const ssidMatch = qrCode.data.match(/S:(.*?);/);
        const passMatch = qrCode.data.match(/P:(.*?);/);
        const encMatch = qrCode.data.match(/T:(.*?);/);
        
        if (ssidMatch) additionalParams.wifi.ssid = ssidMatch[1];
        if (passMatch) additionalParams.wifi.password = passMatch[1];
        if (encMatch) additionalParams.wifi.encryption = encMatch[1];
      } 
      // Add parsing for other complex types as needed
    }
    
    // Hide the history/favorites panels
    showHistory = false;
    showFavorites = false;
  }

  // Save current settings to local storage
  function saveSettings() {
    const settings = {
      errorCorrectionLevel,
      darkColor,
      lightColor,
      scale,
      margin
    };
    
    localStorage.setItem('qrCodeSettings', JSON.stringify(settings));
  }



  // Load settings and history from local storage
  onMount(() => {
    // Load settings
    try {
      const savedSettings = JSON.parse(localStorage.getItem('qrCodeSettings'));
      if (savedSettings) {
        errorCorrectionLevel = savedSettings.errorCorrectionLevel || 'M';
        darkColor = savedSettings.darkColor || '#000000';
        lightColor = savedSettings.lightColor || '#ffffff';
        scale = savedSettings.scale || 8;
        margin = savedSettings.margin || 4;
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    
    // Load recent QR codes
    try {
      const savedRecentCodes = JSON.parse(localStorage.getItem('recentQrCodes'));
      if (savedRecentCodes && Array.isArray(savedRecentCodes)) {
        // Filter out any empty URL QR codes and ensure isFavorite property exists
        recentQrCodes = savedRecentCodes
          .filter(qr => !(qr.type === 'url' && (qr.data === 'https://' || !qr.data)))
          .map(qr => ({
            ...qr,
            isFavorite: qr.isFavorite || false
          }));
        
        // Save the cleaned list back to storage
        localStorage.setItem('recentQrCodes', JSON.stringify(recentQrCodes));
      }
    } catch (e) {
      console.error('Error loading recent QR codes:', e);
    }

    // Load favorites
    try {
      updateFavoritesList();
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
    
    // Generate initial QR code
    generateQRCode();
  });

  // Toggle favorite status of a QR code
  function toggleFavorite(id) {
    // Update in recent codes
    recentQrCodes = recentQrCodes.map(qr => {
      if (qr.id === id) {
        return { ...qr, isFavorite: !qr.isFavorite };
      }
      return qr;
    });
    localStorage.setItem('recentQrCodes', JSON.stringify(recentQrCodes));
    
    // Update favoriteQrCodes list
    updateFavoritesList();
  }

  // Update the favorites list from recent codes
  function updateFavoritesList() {
    favoriteQrCodes = recentQrCodes.filter(qr => qr.isFavorite);
    localStorage.setItem('favoriteQrCodes', JSON.stringify(favoriteQrCodes));
  }

  // Remove a QR code from favorites
  function removeFavorite(id) {
    // Update in recent codes
    recentQrCodes = recentQrCodes.map(qr => {
      if (qr.id === id) {
        return { ...qr, isFavorite: false };
      }
      return qr;
    });
    localStorage.setItem('recentQrCodes', JSON.stringify(recentQrCodes));
    
    // Update favoriteQrCodes list
    updateFavoritesList();
  }
  
  // Delete a QR code from recents (and favorites if it's favorited)
  function deleteQRCode(id) {
    // Remove from recent QR codes
    recentQrCodes = recentQrCodes.filter(qr => qr.id !== id);
    localStorage.setItem('recentQrCodes', JSON.stringify(recentQrCodes));
    
    // Update favoriteQrCodes list
    updateFavoritesList();
  }
  
  // Save settings when any of these values change
  $: if (typeof window !== 'undefined' && errorCorrectionLevel && darkColor && lightColor && scale && margin) {
    saveSettings();
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-4xl mx-auto transition-colors duration-200">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Input Section -->
    <div class="space-y-6">
      <div>
        <label for="qr-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">qr code type</label>
        <select 
          id="qr-type" 
          class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100" 
          value={selectedType.id}
          on:change={handleTypeChange}
        >
          {#each types as type}
            <option value={type.id}>{type.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="qr-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">enter {selectedType.label}</label>
        {#if ['url', 'phone', 'email', 'text'].includes(selectedType.id)}
          <input 
            id="qr-input" 
            type="text" 
            bind:value={inputValue}
            placeholder={selectedType.placeholder}
            class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100 custom-input"
          />
        {:else if selectedType.id === 'wifi'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.wifi.ssid}
              placeholder="network name (SSID)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="password" 
              bind:value={additionalParams.wifi.password}
              placeholder="password"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <select 
              bind:value={additionalParams.wifi.encryption}
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            >
              <option value="WPA">wpa/wpa2</option>
              <option value="WEP">wep</option>
              <option value="nopass">no password</option>
            </select>
          </div>
        {:else if selectedType.id === 'geo'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.geo.latitude}
              placeholder="latitude (e.g. 37.7749)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.geo.longitude}
              placeholder="longitude (e.g. -122.4194)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
          </div>
        {:else if selectedType.id === 'contact'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.contact.firstName}
              placeholder="first name"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.contact.lastName}
              placeholder="last name"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.contact.phone}
              placeholder="phone number"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="email" 
              bind:value={additionalParams.contact.email}
              placeholder="email address"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
          </div>
        {:else if selectedType.id === 'event'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.event.title}
              placeholder="event title"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.event.location}
              placeholder="location"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <textarea 
              bind:value={additionalParams.event.description}
              placeholder="description"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
              rows="2"
            ></textarea>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="event-start" class="block text-xs text-gray-500 dark:text-gray-400">start</label>
                <input 
                  id="event-start"
                  type="datetime-local" 
                  bind:value={additionalParams.event.startDate}
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label for="event-end" class="block text-xs text-gray-500 dark:text-gray-400">end</label>
                <input 
                  id="event-end"
                  type="datetime-local" 
                  bind:value={additionalParams.event.endDate}
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <div class="mt-4">
        <button 
        on:click={generateQRCode}
        class="w-full py-2 bg-blue-500 text-gray-800 dark:text-white rounded-md hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700 font-medium"
        >
        generate qr code
        </button>
      </div>
      
      <div class="space-y-4 mt-6">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">settings</h3>
        
        <div>
          <label for="error-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">error correction level</label>
          <select 
            id="error-level" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100" 
            bind:value={errorCorrectionLevel}
          >
            <option value="L">low (7%)</option>
            <option value="M">medium (15%)</option>
            <option value="Q">quartile (25%)</option>
            <option value="H">high (30%)</option>
          </select>
        </div>
        
        <div>
          <label for="dark-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">qr code color</label>
          <div class="flex items-center space-x-2">
            <input 
              id="dark-color" 
              type="color" 
              bind:value={darkColor}
              class="h-8 w-8 border border-gray-300 rounded"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">{darkColor}</span>
          </div>
        </div>
        
        <div>
          <label for="light-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">background color</label>
          <div class="flex items-center space-x-2">
            <input 
              id="light-color" 
              type="color" 
              bind:value={lightColor}
              class="h-8 w-8 border border-gray-300 rounded"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">{lightColor}</span>
          </div>
        </div>
        
        <div>
          <label for="scale" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">size (scale)</label>
          <input 
            id="scale" 
            type="range" 
            min="1" 
            max="16" 
            bind:value={scale}
            class="w-full"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">{scale}</span>
        </div>
        
        <div>
          <label for="margin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">margin</label>
          <input 
            id="margin" 
            type="range" 
            min="0" 
            max="8" 
            bind:value={margin}
            class="w-full"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">{margin}</span>
        </div>
      </div>
    </div>
    
    <!-- QR Code Display Section -->
    <div class="flex flex-col space-y-6">
      <!-- History and Favorites Buttons -->
      <div class="flex space-x-4 mb-2">
        <button 
          on:click={() => { showHistory = !showHistory; showFavorites = false; }}
          class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          recent
        </button>
        <button 
          on:click={() => { showFavorites = !showFavorites; showHistory = false; }}
          class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          favorites
        </button>
      </div>
      
      <!-- Recent QR Codes Panel -->
      {#if showHistory}
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4 max-h-60 overflow-y-auto">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">recent qr codes</h4>
          {#if recentQrCodes.length > 0}
            <div class="grid grid-cols-2 gap-2 qr-history-grid">
              {#each recentQrCodes as qrCode}
                <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 flex flex-col items-center qr-thumbnail relative">
                  <!-- Star/Favorite button -->
                  <button 
                    class="absolute top-1 right-1 text-xs p-1"
                    on:click={(e) => {
                      e.stopPropagation();
                      toggleFavorite(qrCode.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill={qrCode.isFavorite ? '#FFD700' : 'none'} stroke={qrCode.isFavorite ? '#FFD700' : '#aaaaaa'} stroke-width="1">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  
                  <!-- Delete button -->
                  <button 
                    class="absolute bottom-1 right-1 text-xs p-1"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteQRCode(qrCode.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="#ff6b6b" stroke-width="1.5">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <div class="w-full flex items-center mb-1">
                    <span class="text-xs text-gray-600 dark:text-gray-400 truncate">{qrCode.title || 'QR Code'}</span>
                  </div>
                  <img 
                    src={qrCode.imageUrl} 
                    alt="QR Code" 
                    class="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity" 
                    on:click={() => loadQrCode(qrCode)}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-sm text-gray-500 dark:text-gray-400 text-center p-4">
              no recents yet. generate a qr code to see it here.
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Favorites QR Codes Panel -->
      {#if showFavorites}
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4 max-h-60 overflow-y-auto">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">favorite qr codes</h4>
          {#if favoriteQrCodes.length > 0}
            <div class="grid grid-cols-2 gap-2 qr-history-grid">
              {#each favoriteQrCodes as qrCode}
                <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 flex flex-col items-center qr-thumbnail relative">
                  <!-- Remove from favorites button -->
                  <button 
                    class="absolute top-1 right-1 text-xs p-1"
                    on:click={(e) => {
                      e.stopPropagation();
                      removeFavorite(qrCode.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="#FFD700" stroke="#FFD700" stroke-width="1">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </button>
                  
                  <!-- Delete button -->
                  <button 
                    class="absolute bottom-1 right-1 text-xs p-1"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteQRCode(qrCode.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="#ff6b6b" stroke-width="1.5">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <div class="w-full flex items-center mb-1">
                    <span class="text-xs text-gray-600 dark:text-gray-400 truncate">{qrCode.title || 'QR Code'}</span>
                  </div>
                  <img 
                    src={qrCode.imageUrl} 
                    alt="QR Code" 
                    class="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity" 
                    on:click={() => loadQrCode(qrCode)}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-sm text-gray-500 dark:text-gray-400 text-center p-4">
              no favorites yet. click the star icon on a qr code to add it to your favorites.
            </div>
          {/if}
        </div>
      {/if}
      

      
      {#if qrDataUrl}
        <div class="border border-gray-200 dark:border-gray-700 p-4 rounded-md bg-white dark:bg-gray-700 shadow-sm qr-image-container">
          <img src={qrDataUrl} alt="qr code" class="max-w-full h-auto" />
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button 
            on:click={copyData}
            class="px-10 py-2 bg-blue-500 text-gray-800 dark:text-white rounded-md hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            copy data
          </button>
          
          <button 
            on:click={downloadQRCode}
            class="px-14 py-2 bg-green-500 text-gray-800 dark:text-white rounded-md hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
          >
            download qr code
          </button>
        </div>
      {:else}
        <div class="text-gray-500 dark:text-gray-400 text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          enter data to generate a qr code
        </div>
      {/if}
    </div>
  </div>
</div>