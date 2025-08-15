import * as Network from 'expo-network';

export async function getLocalIPAddress(): Promise<string | null> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    if (networkState.isConnected) {
      // When hosting hotspot, the host device typically gets IP 192.168.43.1
      // This is the default gateway IP for most mobile hotspots
      return '192.168.43.1';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return null;
  }
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function isValidIPAddress(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

export function getSocketURL(ipAddress: string, port: number = 3000): string {
  return `http://${ipAddress}:${port}`;
}

export function getQRCodeData(ipAddress: string, port: number = 3000): string {
  return JSON.stringify({
    type: 'lan-mafia-game',
    ip: ipAddress,
    port: port,
    timestamp: Date.now(),
  });
} 