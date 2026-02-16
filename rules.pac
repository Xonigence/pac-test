function FindProxyForURL(url, host) {

  // Flipkart → bypass VPN + bypass proxy
  if (dnsDomainIs(host, "flipkart.com") || shExpMatch(host, "*.flipkart.com")) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY 192.168.1.13:3128";
}
