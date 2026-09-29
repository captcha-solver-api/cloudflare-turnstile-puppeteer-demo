console.clear = () => console.log('Console was cleared');

const interval = setInterval(() => {
  if (!window.turnstile) return;

  clearInterval(interval);
  window.turnstile.render = (_container, options) => {
    const params = {
      websiteKey: options.sitekey,
      websiteURL: window.location.href,
      data: options.cData,
      pagedata: options.chlPageData,
      action: options.action,
      userAgent: navigator.userAgent
    };

    console.log(`intercepted-params:${JSON.stringify(params)}`);
    window.cfCallback = options.callback;
    return undefined;
  };
}, 50);
