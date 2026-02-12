function FindProxyForURL(url, host) {
  // Flipkart domains → use proxy
  if (dnsDomainIs(host, "flipkart.com") || shExpMatch(host, "*.flipkart.com")) {
      return "PROXY 192.168.1.13:3128; DIRECT";
  }
  // Direct for everything else
  return "DIRECT";
}
