function FindProxyForURL(url, host) {


  if (shExpMatch(host, "*.myntra.com") || shExpMatch(host, "*.wikipedia.org") || shExpMatch(host, "myntra.com") || shExpMatch(host, "wikipedia.org")) {
    return "PROXY 10.42.2.61:8090";
  }

  return "DIRECT";
}
