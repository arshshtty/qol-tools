// Simplified MAC vendor lookup (top manufacturers)
// Full database would be very large, this covers common devices

const MAC_VENDORS = {
  // Apple
  '00:03:93': 'Apple',
  '00:0a:27': 'Apple',
  '00:0a:95': 'Apple',
  '00:0d:93': 'Apple',
  '00:16:cb': 'Apple',
  '00:17:f2': 'Apple',
  '00:1b:63': 'Apple',
  '00:1c:b3': 'Apple',
  '00:1d:4f': 'Apple',
  '00:1e:52': 'Apple',
  '00:1f:5b': 'Apple',
  '00:1f:f3': 'Apple',
  '00:21:e9': 'Apple',
  '00:22:41': 'Apple',
  '00:23:12': 'Apple',
  '00:23:32': 'Apple',
  '00:23:6c': 'Apple',
  '00:23:df': 'Apple',
  '00:24:36': 'Apple',
  '00:25:00': 'Apple',
  '00:25:4b': 'Apple',
  '00:25:bc': 'Apple',
  '00:26:08': 'Apple',
  '00:26:4a': 'Apple',
  '00:26:b0': 'Apple',
  '00:26:bb': 'Apple',

  // Samsung
  '00:00:f0': 'Samsung',
  '00:07:ab': 'Samsung',
  '00:12:fb': 'Samsung',
  '00:13:77': 'Samsung',
  '00:15:b9': 'Samsung',
  '00:16:32': 'Samsung',
  '00:16:6b': 'Samsung',
  '00:16:6c': 'Samsung',
  '00:17:c9': 'Samsung',
  '00:17:d5': 'Samsung',
  '00:18:af': 'Samsung',
  '00:1a:8a': 'Samsung',

  // Google
  '00:1a:11': 'Google',
  '3c:5a:b4': 'Google',
  'f4:f5:d8': 'Google',

  // Amazon
  '00:71:47': 'Amazon',
  '68:37:e9': 'Amazon',
  'f0:d2:f1': 'Amazon',

  // Roku
  '00:0d:4b': 'Roku',
  'b0:a7:37': 'Roku',
  'dc:3a:5e': 'Roku',

  // TP-Link
  '00:27:19': 'TP-Link',
  '50:c7:bf': 'TP-Link',
  'f4:ec:38': 'TP-Link',

  // Raspberry Pi
  'b8:27:eb': 'Raspberry Pi',
  'dc:a6:32': 'Raspberry Pi',

  // Intel
  '00:02:b3': 'Intel',
  '00:03:47': 'Intel',
  '00:04:23': 'Intel',
  '00:0e:0c': 'Intel',

  // Microsoft
  '00:03:ff': 'Microsoft',
  '00:0d:3a': 'Microsoft',
  '00:12:5a': 'Microsoft',

  // Sony
  '00:04:1f': 'Sony',
  '00:0a:d9': 'Sony',
  '00:13:15': 'Sony',

  // Xiaomi
  '34:ce:00': 'Xiaomi',
  '64:09:80': 'Xiaomi',
  '78:11:dc': 'Xiaomi'
};

export function getVendor(mac) {
  if (!mac) return 'Unknown';

  // Get first 3 octets (manufacturer ID)
  const prefix = mac.toLowerCase().substring(0, 8);

  return MAC_VENDORS[prefix] || 'Unknown';
}

// Online API fallback (optional - could be used for unknown vendors)
export async function getVendorOnline(mac) {
  try {
    const fetch = (await import('node-fetch')).default;
    const prefix = mac.replace(/:/g, '').substring(0, 6);
    const response = await fetch(`https://api.macvendors.com/${prefix}`);

    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    // Fallback to offline database
  }

  return getVendor(mac);
}
