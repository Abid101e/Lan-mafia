/**
 * Network Discovery Utility for Client
 *
 * Handles automatic detection of available host servers on the local network
 * without requiring hardcoded IP addresses.
 */

import { Platform } from "react-native";

class NetworkDiscovery {
  constructor() {
    this.discoveredHosts = [];
    this.scanTimeout = 5000; // 5 seconds timeout for scanning
  }

  /**
   * Generate possible IP addresses for the current network
   * Based on common network ranges and device IP patterns
   */
  generatePossibleIPs() {
    const commonNetworks = [
      // Home router ranges
      "192.168.1.",
      "192.168.0.",
      "192.168.2.",

      // Enterprise/office ranges
      "10.0.0.",
      "10.1.0.",
      "10.220.54.", // Your current network range

      // Alternative enterprise ranges
      "172.16.0.",
      "172.17.0.",
      "172.18.0.",

      // Mobile hotspot ranges
      "192.168.43.",
      "192.168.54.", // Your PPP range
    ];

    const possibleIPs = [];

    // Generate IP ranges for common network patterns
    commonNetworks.forEach((network) => {
      // Try common host IPs in each range
      for (let i = 1; i <= 254; i++) {
        // Focus on common router/host IPs first
        if (i <= 10 || i >= 100) {
          possibleIPs.push(network + i);
        }
      }
    });

    // Add localhost fallbacks
    possibleIPs.push("localhost", "127.0.0.1");

    return possibleIPs;
  }

  /**
   * Scan for available game hosts on the network
   * Returns a promise that resolves with discovered host IPs
   */
  async scanForHosts(port = 3000, maxConcurrent = 10) {
    const possibleIPs = this.generatePossibleIPs();
    const discoveredHosts = [];

    console.log(
      `🔍 Scanning ${possibleIPs.length} possible IP addresses for game hosts...`
    );

    // Split IPs into chunks for concurrent scanning
    const chunks = [];
    for (let i = 0; i < possibleIPs.length; i += maxConcurrent) {
      chunks.push(possibleIPs.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      const promises = chunk.map((ip) => this.testConnection(ip, port));
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          discoveredHosts.push(chunk[index]);
          console.log(`✅ Found host at: ${chunk[index]}`);
        }
      });

      // If we found at least one host, we can return early
      if (discoveredHosts.length > 0) {
        break;
      }
    }

    this.discoveredHosts = discoveredHosts;
    console.log(
      `🎯 Discovery complete. Found ${discoveredHosts.length} hosts:`,
      discoveredHosts
    );

    return discoveredHosts;
  }

  /**
   * Test if a specific IP has a game server running
   * Returns a promise that resolves to true if server is reachable
   */
  async testConnection(ip, port = 3000, timeout = 2000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      try {
        // For React Native, we'll use a simple HTTP check
        // Since we can't directly test TCP connections
        const testUrl = `http://${ip}:${port}/health`;

        fetch(testUrl, {
          method: "GET",
          timeout: timeout,
        })
          .then((response) => {
            clearTimeout(timeoutId);
            resolve(response.ok || response.status < 500);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            resolve(false);
          });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve(false);
      }
    });
  }

  /**
   * Scan for games on a specific IP
   * Returns available games if any are found
   */
  async scanGamesOnHost(ip, port = 3000, timeout = 3000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve([]);
      }, timeout);

      try {
        const gamesUrl = `http://${ip}:${port}/discover-games`;

        fetch(gamesUrl, {
          method: "GET",
          timeout: timeout,
        })
          .then((response) => {
            clearTimeout(timeoutId);
            if (!response.ok) {
              resolve([]);
              return;
            }
            return response.json();
          })
          .then((data) => {
            if (data && data.success && data.games) {
              resolve(data.games);
            } else {
              resolve([]);
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
            resolve([]);
          });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve([]);
      }
    });
  }

  /**
   * Comprehensive scan for games across the network
   * Returns all discovered games with their host information
   */
  async scanForGamesOnNetwork(timeout = 8000) {
    console.log("🔍 Starting comprehensive game scan...");
    const allGames = [];
    const scannedHosts = new Set();

    // First try a quick scan for common host IPs
    const quickHosts = await this.quickScan();

    for (const hostIP of quickHosts) {
      if (scannedHosts.has(hostIP)) continue;
      scannedHosts.add(hostIP);

      try {
        const games = await this.scanGamesOnHost(hostIP);
        if (games.length > 0) {
          games.forEach((game) => {
            if (!allGames.find((g) => g.gameCode === game.gameCode)) {
              allGames.push({ ...game, discoveredAt: hostIP });
            }
          });
          console.log(`🎮 Found ${games.length} game(s) on ${hostIP}`);
        }
      } catch (error) {
        console.log(`❌ Error scanning ${hostIP}:`, error.message);
      }
    }

    // If no games found in quick scan, try broader scan
    if (allGames.length === 0) {
      console.log("🔄 No games in quick scan, trying broader network scan...");
      const allHosts = await this.scanForHosts(3000, 5); // Smaller chunks for game scanning

      for (const hostIP of allHosts.slice(0, 20)) {
        // Limit to first 20 hosts for performance
        if (scannedHosts.has(hostIP)) continue;
        scannedHosts.add(hostIP);

        try {
          const games = await this.scanGamesOnHost(hostIP, 3000, 2000);
          if (games.length > 0) {
            games.forEach((game) => {
              if (!allGames.find((g) => g.gameCode === game.gameCode)) {
                allGames.push({ ...game, discoveredAt: hostIP });
              }
            });
            console.log(`🎮 Found ${games.length} game(s) on ${hostIP}`);
          }
        } catch (error) {
          console.log(`❌ Error scanning ${hostIP}:`, error.message);
        }
      }
    }

    console.log(`🏁 Game scan complete. Found ${allGames.length} total games`);
    return allGames;
  }

  /**
   * Get the best host IP from discovered hosts
   * Prioritizes based on network proximity and reliability
   */
  getBestHost() {
    if (this.discoveredHosts.length === 0) {
      return null;
    }

    // Prioritize local network IPs over localhost
    const localNetworkHosts = this.discoveredHosts.filter(
      (ip) => !ip.includes("localhost") && !ip.includes("127.0.0.1")
    );

    if (localNetworkHosts.length > 0) {
      // Return the first local network host found
      return localNetworkHosts[0];
    }

    // Fallback to localhost if no local network hosts found
    return this.discoveredHosts[0];
  }

  /**
   * Quick scan for hosts in common network ranges
   * Faster than full scan, focuses on likely host IPs
   */
  async quickScan(port = 3000) {
    const commonHostIPs = [
      // Current network patterns (from your hardcoded IPs)
      "10.220.54.130",
      "192.168.54.91",

      // Common router IPs
      "192.168.1.1",
      "192.168.0.1",
      "192.168.1.100",
      "192.168.0.100",

      // Common host ranges
      "10.0.0.1",
      "10.1.0.1",

      // Mobile hotspot
      "192.168.43.1",

      // Localhost fallback
      "localhost",
      "127.0.0.1",
    ];

    console.log("🚀 Quick scanning common host IPs...");

    const promises = commonHostIPs.map((ip) =>
      this.testConnection(ip, port, 1500)
    );
    const results = await Promise.allSettled(promises);

    const foundHosts = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        foundHosts.push(commonHostIPs[index]);
        console.log(`⚡ Quick scan found host: ${commonHostIPs[index]}`);
      }
    });

    this.discoveredHosts = foundHosts;
    return foundHosts;
  }
}

// Export singleton instance
export const networkDiscovery = new NetworkDiscovery();
export default NetworkDiscovery;
