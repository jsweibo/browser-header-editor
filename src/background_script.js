let activeRules = [];

function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      if (res.config.status) {
        // on

        // get active rules
        activeRules = res.config.rules.filter(function (rule) {
          if (
            !('status' in rule) &&
            Array.isArray(rule.matches) &&
            rule.matches.length
          ) {
            return true;
          }
          if (
            'status' in rule &&
            rule.status &&
            Array.isArray(rule.matches) &&
            rule.matches.length
          ) {
            return true;
          }
        });

        activeRules.forEach(function (activeRule) {
          // onBeforeSendHeaders callback
          if (
            (Array.isArray(activeRule.removeRequestHeaders) &&
              activeRule.removeRequestHeaders.length) ||
            (Array.isArray(activeRule.addRequestHeaders) &&
              activeRule.addRequestHeaders.length)
          ) {
            // generate
            activeRule.onBeforeSendHeaders = function (requestDetails) {
              let headers = [];

              // remove
              if (
                Array.isArray(activeRule.removeRequestHeaders) &&
                activeRule.removeRequestHeaders.length
              ) {
                requestDetails.requestHeaders.forEach(function (header) {
                  const headerIndex = activeRule.removeRequestHeaders.findIndex(
                    function (item) {
                      return header.name.toLowerCase() === item.toLowerCase();
                    }
                  );
                  if (headerIndex === -1) {
                    // keep
                    headers.push(header);
                  }
                });
              } else {
                headers = requestDetails.requestHeaders;
              }

              // add
              if (
                Array.isArray(activeRule.addRequestHeaders) &&
                activeRule.addRequestHeaders.length
              ) {
                headers = headers.concat(activeRule.addRequestHeaders);
              }

              return {
                requestHeaders: headers,
              };
            };

            // bind
            chrome.webRequest.onBeforeSendHeaders.addListener(
              activeRule.onBeforeSendHeaders,
              {
                urls: activeRule.matches,
              },
              ['blocking', 'requestHeaders', 'extraHeaders']
            );
          }

          // onHeadersReceived callback
          if (
            (Array.isArray(activeRule.removeResponseHeaders) &&
              activeRule.removeResponseHeaders.length) ||
            (Array.isArray(activeRule.addResponseHeaders) &&
              activeRule.addResponseHeaders.length)
          ) {
            // generate
            activeRule.onHeadersReceived = function (requestDetails) {
              let headers = [];

              // remove
              if (
                Array.isArray(activeRule.removeResponseHeaders) &&
                activeRule.removeResponseHeaders.length
              ) {
                requestDetails.responseHeaders.forEach(function (header) {
                  const headerIndex =
                    activeRule.removeResponseHeaders.findIndex(function (item) {
                      return header.name.toLowerCase() === item.toLowerCase();
                    });
                  if (headerIndex === -1) {
                    // keep
                    headers.push(header);
                  }
                });
              } else {
                headers = requestDetails.responseHeaders;
              }

              // add
              if (
                Array.isArray(activeRule.addResponseHeaders) &&
                activeRule.addResponseHeaders.length
              ) {
                headers = headers.concat(activeRule.addResponseHeaders);
              }

              return {
                responseHeaders: headers,
              };
            };

            // bind
            chrome.webRequest.onHeadersReceived.addListener(
              activeRule.onHeadersReceived,
              {
                urls: activeRule.matches,
              },
              ['blocking', 'responseHeaders', 'extraHeaders']
            );
          }
        });
      }
    } else {
      // writing settings will invoke chrome.storage.onChanged
      chrome.storage.local.set({
        config: DEFAULT_SETTINGS,
      });
    }
  });
}

chrome.browserAction.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener(function () {
  // clear
  activeRules.forEach(function (activeRule) {
    if (activeRule.onBeforeSendHeaders) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(
        activeRule.onBeforeSendHeaders
      );
    }
    if (activeRule.onHeadersReceived) {
      chrome.webRequest.onHeadersReceived.removeListener(
        activeRule.onHeadersReceived
      );
    }
  });
  activeRules = [];

  // restart
  start();
});

// start
start();
