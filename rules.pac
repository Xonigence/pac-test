function FindProxyForURL(url, host) {

  // Flipkart → bypass VPN + proxy
  if (shExpMatch(host, "*.indiahikes.com")) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY mobile.skyhigh.cloud:8080";
}
