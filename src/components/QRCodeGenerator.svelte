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
  let scale = 8;
  let margin = 4;
  
  // Additional parameters for complex QR types
  let additionalParams = {
    wifi: { ssid: '', password: '', encryption: 'WPA' },
    geo: { latitude: '', longitude: '' },
    contact: { firstName: '', lastName: '', phone: '', email: '' },
    event: { title: '', location: '', description: '', startDate: '', endDate: '' }
  };
  
  // Format the QR data based on the selected type
  $: formattedData = inputValue && ['url', 'phone', 'email', 'text'].includes(selectedType.id)
    ? selectedType.format(inputValue)
    : selectedType.format('', additionalParams[selectedType.id]);
  
  // Generate QR code whenever the data or settings change
  $: if (formattedData) generateQRCode();

  // Function to generate the QR code
  async function generateQRCode() {
    if (!formattedData) return;
    
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
      
      // Note for advanced styling: The base qrcode library doesn't support
      // all styling options. For a production app, you would need to use a dedicated
      // styling library like qr-code-styling and implement it differently.
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
  
  // Generate a QR code on component mount
  onMount(() => {
    generateQRCode();
  });
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
            class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
          />
        {:else if selectedType.id === 'wifi'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.wifi.ssid}
              placeholder="Network name (SSID)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="password" 
              bind:value={additionalParams.wifi.password}
              placeholder="Password"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <select 
              bind:value={additionalParams.wifi.encryption}
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </div>
        {:else if selectedType.id === 'geo'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.geo.latitude}
              placeholder="Latitude (e.g. 37.7749)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.geo.longitude}
              placeholder="Longitude (e.g. -122.4194)"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
          </div>
        {:else if selectedType.id === 'contact'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.contact.firstName}
              placeholder="First Name"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.contact.lastName}
              placeholder="Last Name"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.contact.phone}
              placeholder="Phone Number"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="email" 
              bind:value={additionalParams.contact.email}
              placeholder="Email Address"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
          </div>
        {:else if selectedType.id === 'event'}
          <div class="space-y-2">
            <input 
              type="text" 
              bind:value={additionalParams.event.title}
              placeholder="Event Title"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <input 
              type="text" 
              bind:value={additionalParams.event.location}
              placeholder="Location"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
            />
            <textarea 
              bind:value={additionalParams.event.description}
              placeholder="Description"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
              rows="2"
            ></textarea>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="event-start" class="block text-xs text-gray-500 dark:text-gray-400">Start</label>
                <input 
                  id="event-start"
                  type="datetime-local" 
                  bind:value={additionalParams.event.startDate}
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label for="event-end" class="block text-xs text-gray-500 dark:text-gray-400">End</label>
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
      
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">settings</h3>
        
        <div>
          <label for="error-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">error correction level</label>
          <select 
            id="error-level" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100" 
            bind:value={errorCorrectionLevel}
            on:change={generateQRCode}
          >
            <option value="L">low (7%)</option>
            <option value="M">medium (15%)</option>
            <option value="Q">quartile (25%)</option>
            <option value="H">high (30%)</option>
          </select>
        </div>
        
        <div>
          <label for="dark-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">dark color</label>
          <div class="flex items-center space-x-2">
            <input 
              id="dark-color" 
              type="color" 
              bind:value={darkColor}
              on:change={generateQRCode}
              class="h-8 w-8 border border-gray-300 rounded"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">{darkColor}</span>
          </div>
        </div>
        
        <div>
          <label for="light-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">light color</label>
          <div class="flex items-center space-x-2">
            <input 
              id="light-color" 
              type="color" 
              bind:value={lightColor}
              on:change={generateQRCode}
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
            on:input={generateQRCode}
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
            on:input={generateQRCode}
            class="w-full"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">{margin}</span>
        </div>
      </div>
    </div>
    
    <!-- QR Code Display Section -->
    <div class="flex flex-col items-center justify-center space-y-6">
      {#if qrDataUrl}
        <div class="border border-gray-200 dark:border-gray-700 p-4 rounded-md bg-white dark:bg-gray-700 shadow-sm">
          <img src={qrDataUrl} alt="qr code" class="max-w-full h-auto" />
        </div>
        
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full justify-center">
          <button 
            on:click={copyData}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            copy data
          </button>
          
          <button 
            on:click={downloadQRCode}
            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
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
