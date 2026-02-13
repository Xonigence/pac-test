function FindProxyForURL(url, host) {

  // Flipkart → bypass VPN + proxy
  if (dnsDomainIs(host, "indiahikes.com") || shExpMatch(host, "*.indiahikes.com")) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY mobile.skyhigh.cloud:8080";
}
