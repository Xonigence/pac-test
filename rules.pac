function FindProxyForURL(url, host) {


  if (shExpMatch(host, "*.flipkart.com") || shExpMatch(host, "*.wikipedia.org")) {
    return "PROXY 10.42.2.61:8090";
  }

  return "DIRECT";
}
