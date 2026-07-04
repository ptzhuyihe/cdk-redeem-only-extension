(function attachRedeemCdkeyUsage(root, factory) {
  root.MultiPageRedeemCdkeyUsage = factory(root);
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemCdkeyUsage(rootScope) {
  const CDK_STATE_KEY_ALIASES = Object.freeze({
    cdkPoolText: ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkPoolText: ['upiRedeemCdkPoolText', 'cdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkeyPoolText: ['upiRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'pixRedeemCdkeyPoolText'],
    pixRedeemCdkeyPoolText: ['pixRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText'],
    cdkUsage: ['cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkUsage: ['upiRedeemCdkUsage', 'cdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkeyUsage: ['upiRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'pixRedeemCdkeyUsage'],
    pixRedeemCdkeyUsage: ['pixRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage'],
  });

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeRedeemChannel(channel = 'upi') {
    const helper = rootScope.MultiPageRedeemChannelState?.normalizeRedeemChannel;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    return normalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function getUpiRedeemStateValue(state = {}, key = '') {
    const normalizedKey = normalizeString(key);
    if (!normalizedKey) return undefined;
    if (state?.[normalizedKey] !== undefined) return state[normalizedKey];
    const aliases = CDK_STATE_KEY_ALIASES[normalizedKey] || [];
    for (const alias of aliases) {
      if (state?.[alias] !== undefined) return state[alias];
    }
    const legacyKey = normalizedKey.replace(/^upiRedeem/, 'pixRedeem');
    return legacyKey === normalizedKey ? undefined : state?.[legacyKey];
  }

  function getRedeemChannelPoolKey(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemCdkeyPoolText'
      : 'upiRedeemCdkeyPoolText';
  }

  function getRedeemChannelUsageKey(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemCdkeyUsage'
      : 'upiRedeemCdkeyUsage';
  }

  function getRedeemChannelPoolText(state = {}, channel = 'upi') {
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return normalizeString(state?.idealRedeemCdkeyPoolText);
    }
    return getUpiRedeemStateValue(state, 'upiRedeemCdkeyPoolText');
  }

  function getRedeemChannelUsage(state = {}, channel = 'upi', options = {}) {
    const source = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    const hasDefaultValue = Object.prototype.hasOwnProperty.call(options || {}, 'defaultValue');
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return Object.prototype.hasOwnProperty.call(source, 'idealRedeemCdkeyUsage')
        ? source.idealRedeemCdkeyUsage
        : (hasDefaultValue ? options.defaultValue : undefined);
    }
    const value = getUpiRedeemStateValue(source, 'upiRedeemCdkeyUsage');
    return value !== undefined ? value : (hasDefaultValue ? options.defaultValue : undefined);
  }

  function normalizeUsageWith(options = {}, usage = {}) {
    if (typeof options.normalizeUsage === 'function') {
      return options.normalizeUsage(usage || {});
    }
    return usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
  }

  function buildRedeemChannelUsageUpdates(channel = 'upi', usage = {}, options = {}) {
    const normalizedUsage = normalizeUsageWith(options, usage);
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return {
        idealRedeemCdkeyUsage: normalizedUsage,
      };
    }
    return {
      cdkUsage: normalizedUsage,
      upiRedeemCdkUsage: normalizedUsage,
      upiRedeemCdkeyUsage: normalizedUsage,
    };
  }

  return {
    getUpiRedeemStateValue,
    getRedeemChannelPoolKey,
    getRedeemChannelUsageKey,
    getRedeemChannelPoolText,
    getRedeemChannelUsage,
    buildRedeemChannelUsageUpdates,
  };
});
