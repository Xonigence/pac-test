function FindProxyForURL(url, host) {

  // Flipkart → bypass VPN + proxy
  if (dnsDomainIs(host, "flipkart.com") || shExpMatch(host, "*.flipkart.com")) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY mobile.skyhigh.cloud:8080";
}
