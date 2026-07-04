// content/signup-phone-page.js — Phone signup utility helpers.
(function attachSignupPhonePage(root) {
  function createSignupPhonePage(context = {}) {
    const {
      documentRef = document,
      navigatorRef = root.navigator || globalThis.navigator || null,
      phoneCountryUtils = root.MultiPagePhoneCountryUtils || globalThis.MultiPagePhoneCountryUtils || {},
    } = context;

    function normalizePhoneDigits(value) {
      if (typeof phoneCountryUtils.normalizePhoneDigits === 'function') {
        return phoneCountryUtils.normalizePhoneDigits(value);
      }
      let digits = String(value || '').replace(/\D+/g, '');
      if (digits.startsWith('00')) {
        digits = digits.slice(2);
      }
      return digits;
    }

    function extractDialCodeFromText(value) {
      if (typeof phoneCountryUtils.extractDialCodeFromText === 'function') {
        return phoneCountryUtils.extractDialCodeFromText(value);
      }
      const match = String(value || '').match(/\(\+\s*(\d{1,4})\s*\)|\+\s*\(\s*(\d{1,4})\s*\)|\+\s*(\d{1,4})\b/);
      return String(match?.[1] || match?.[2] || match?.[3] || '').trim();
    }

    function dispatchSignupPhoneFieldEvents(element) {
      if (!element) return;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function normalizeSignupCountryLabel(value) {
      if (typeof phoneCountryUtils.normalizeCountryLabel === 'function') {
        return phoneCountryUtils.normalizeCountryLabel(value);
      }
      return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }

    function getSignupCountryLabelAliases(value) {
      if (typeof phoneCountryUtils.getCountryLabelAliases === 'function') {
        return phoneCountryUtils.getCountryLabelAliases(value);
      }
      const aliases = new Set();
      const addAlias = (alias) => {
        const normalized = normalizeSignupCountryLabel(alias);
        if (normalized) {
          aliases.add(normalized);
        }
      };

      const raw = String(value || '').trim();
      addAlias(raw);
      Array.from(raw.matchAll(/\(([^()]+)\)/g))
        .map((match) => match[1])
        .forEach(addAlias);
      const withoutParentheses = raw.replace(/\([^()]*\)/g, ' ');
      const withoutDialCodes = withoutParentheses
        .replace(/\+\s*\d{1,4}\b/g, ' ')
        .replace(/\(\s*\+\s*\d{1,4}\s*\)/g, ' ');
      addAlias(withoutDialCodes);

      const normalized = normalizeSignupCountryLabel(raw);
      const compact = normalized.replace(/\s+/g, '');
      if (
        /(?:^|\s)(?:gb|uk)(?:\s|$)/i.test(raw)
        || /england|united\s*kingdom|great\s*britain|\bbritain\b/i.test(raw)
        || /英国|英格兰|大不列颠/.test(raw)
        || ['gb', 'uk', 'england', 'unitedkingdom', 'greatbritain', 'britain'].includes(compact)
      ) {
        [
          'GB',
          'UK',
          'United Kingdom',
          'Great Britain',
          'Britain',
          'England',
          '英国',
          '英格兰',
          '大不列颠',
        ].forEach(addAlias);
      }

      return Array.from(aliases);
    }

    function isLooseSignupCountryLabelMatch(optionLabel, targetLabel) {
      if (typeof phoneCountryUtils.isLooseCountryLabelMatch === 'function') {
        return phoneCountryUtils.isLooseCountryLabelMatch(optionLabel, targetLabel);
      }
      if (!optionLabel || !targetLabel || optionLabel.length <= 2 || targetLabel.length <= 2) {
        return false;
      }
      if (optionLabel.includes(targetLabel)) {
        return true;
      }
      return /\s/.test(optionLabel) && targetLabel.includes(optionLabel);
    }

    function getSignupPhoneOptionLabel(option) {
      if (typeof phoneCountryUtils.getOptionLabel === 'function') {
        return phoneCountryUtils.getOptionLabel(option);
      }
      return String(option?.textContent || option?.label || '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function normalizeSignupCountryOptionValue(value) {
      if (typeof phoneCountryUtils.normalizeCountryOptionValue === 'function') {
        return phoneCountryUtils.normalizeCountryOptionValue(value);
      }
      return String(value || '').trim().toUpperCase();
    }

    function getSignupRegionDisplayName(regionCode, locale) {
      if (typeof phoneCountryUtils.getRegionDisplayName === 'function') {
        return phoneCountryUtils.getRegionDisplayName(regionCode, locale);
      }
      const normalizedRegionCode = normalizeSignupCountryOptionValue(regionCode);
      const normalizedLocale = String(locale || '').trim();
      if (!/^[A-Z]{2}$/.test(normalizedRegionCode) || !normalizedLocale || typeof Intl?.DisplayNames !== 'function') {
        return '';
      }
      try {
        return String(
          new Intl.DisplayNames([normalizedLocale], { type: 'region' }).of(normalizedRegionCode) || ''
        ).trim();
      } catch {
        return '';
      }
    }

    function getSignupPhoneCountryMatchLabels(option) {
      if (typeof phoneCountryUtils.getOptionMatchLabels === 'function') {
        return phoneCountryUtils.getOptionMatchLabels(option, {
          document: documentRef,
          navigator: navigatorRef,
          getOptionLabel: getSignupPhoneOptionLabel,
        });
      }

      const labels = new Set();
      const pushLabel = (value) => {
        const label = String(value || '').replace(/\s+/g, ' ').trim();
        if (label) {
          labels.add(label);
        }
      };

      pushLabel(getSignupPhoneOptionLabel(option));

      const regionCode = normalizeSignupCountryOptionValue(option?.value);
      if (/^[A-Z]{2}$/.test(regionCode)) {
        pushLabel(regionCode);
        pushLabel(getSignupRegionDisplayName(regionCode, 'en'));

        const pageLocale = String(
          documentRef?.documentElement?.lang
          || documentRef?.documentElement?.getAttribute?.('lang')
          || navigatorRef?.language
          || ''
        ).trim();
        if (pageLocale && !/^en(?:[-_]|$)/i.test(pageLocale)) {
          pushLabel(getSignupRegionDisplayName(regionCode, pageLocale));
        }
      }

      return Array.from(labels);
    }

    function isSameSignupCountryOption(left, right) {
      if (!left || !right) {
        return false;
      }

      const leftValue = normalizeSignupCountryOptionValue(left.value);
      const rightValue = normalizeSignupCountryOptionValue(right.value);
      if (leftValue && rightValue) {
        return leftValue === rightValue;
      }

      return normalizeSignupCountryLabel(getSignupPhoneOptionLabel(left)) === normalizeSignupCountryLabel(getSignupPhoneOptionLabel(right));
    }

    return {
      normalizePhoneDigits,
      extractDialCodeFromText,
      dispatchSignupPhoneFieldEvents,
      normalizeSignupCountryLabel,
      getSignupCountryLabelAliases,
      isLooseSignupCountryLabelMatch,
      getSignupPhoneOptionLabel,
      normalizeSignupCountryOptionValue,
      getSignupRegionDisplayName,
      getSignupPhoneCountryMatchLabels,
      isSameSignupCountryOption,
    };
  }

  root.MultiPageSignupPhonePage = { createSignupPhonePage };
})(typeof self !== 'undefined' ? self : window);
