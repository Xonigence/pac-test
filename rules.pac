function FindProxyForURL(url, host) {

  //  bypass VPN + proxy
  if (shExpMatch(host, "*.indiahikes.com") || shExpMatch(host, "*.flipkart.com") || shExpMatch(host, "*.cricbuzz.com") ) {
      return "DIRECT";
  }

  // Everything else → go to proxy
  return "PROXY 10.0.0.1:8080";
}
