const DEFAULT_SETTINGS = {
  status: false,
  rules: [
    {
      matches: ['*://*.nintendo.com/*'],
      removeResponseHeaders: [
        'content-security-policy',
        'x-content-security-policy',
        'x-webkit-csp',
      ],
    },
  ],
};
