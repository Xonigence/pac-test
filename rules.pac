unction FindProxyForURL(url, host) {

  // Flipkart bypass
  if (shExpMatch(host, "*.flipkart.com")) {
      return "DIRECT";
  }

  // Everything else goes to proxy
  return "PROXY 10.213.139.151:8080";
}
