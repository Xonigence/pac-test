function FindProxyForURL(url, host) {

 
  if (dnsDomainIs(host, "flipkart.com") || shExpMatch(host, "*.flipkart.com") || shExpMatch(host, "*.google.com") ) {
  return "PROXY 10.42.3.196:8080";
  }

  return "DIRECT"
}
