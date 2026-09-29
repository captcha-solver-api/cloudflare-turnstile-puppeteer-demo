import { Tasks } from '@captcha-solver-api/javascript-sdk';

export function isCloudflareChallengeTitle(title) {
  return /just a moment|\u043e\u0434\u0438\u043d \u043c\u043e\u043c\u0435\u043d\u0442/i.test(title);
}

export function createTurnstileTask(params) {
  return new Tasks.GenericTask({
    type: 'TurnstileTaskProxyless',
    websiteURL: params.websiteURL,
    websiteKey: params.websiteKey,
    action: params.action ?? null,
    data: params.data ?? null,
    pagedata: params.pagedata ?? null,
    userAgent: params.userAgent ?? null
  });
}
