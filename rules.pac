function FindProxyForURL(url, host) {

  // Flipkart bypass
  if (shExpMatch(host, "*.flipkart.com")) {
      return "DIRECT";
  }

  // Everything else goes to proxy
  return "PROXY 10.42.6.23:8090";
}
