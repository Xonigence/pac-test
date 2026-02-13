function FindProxyForURL(url, host) {

  //  bypass VPN + proxy
  if (shExpMatch(host, "*.indiahikes.com") || shExpMatch(host, "*.flipkart.com") ) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY mobile.skyhigh.cloud:8080";
}
