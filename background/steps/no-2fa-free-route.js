(function attachNo2faFreeRouteExecutor(root, factory) {
  root.MultiPageBackgroundNo2faFreeRoute = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createNo2faFreeRouteModule() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function normalizeTimestamp(value, fallback = Date.now()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0
      ? Math.floor(numeric)
      : Math.max(1, Math.floor(Number(fallback) || Date.now()));
  }

  function getSessionEmail(session = {}) {
    return normalizeEmail(
      session?.user?.email
      || session?.email
      || session?.account?.email
      || session?.profile?.email
      || ''
    );
  }

  function createNo2faFreeRouteExecutor(deps = {}) {
    const {
      addLog = async () => {},
      checkRegistrationUpiTrialEligibility = null,
      completeNodeFromBackground = async () => {},
      getCustomEmailPoolEntries = null,
      getState = async () => ({}),
      readCurrentChatGptSessionForExport = null,
      setState = async () => {},
      throwIfStopped = () => {},
    } = deps;

    async function addStepLog(message, level = 'info') {
      return addLog(message, level, {
        step: 6,
        stepKey: 'persist-no-2fa-free',
        nodeId: 'persist-no-2fa-free',
      });
    }

    function resolveVerificationUrl(state = {}, email = '') {
      const direct = normalizeString(
        state.verificationUrl
        || state.emailVerificationUrl
        || state.currentVerificationUrl
        || state.currentEmailVerificationUrl
        || ''
      );
      if (direct) {
        return direct;
      }

      const entries = typeof getCustomEmailPoolEntries === 'function'
        ? getCustomEmailPoolEntries(state)
        : [];
      const normalizedEmail = normalizeEmail(email);
      const matched = entries.find((entry) => {
        const entryEmail = normalizeEmail(entry?.email || entry?.mail || entry?.address || entry?.credential);
        return entryEmail && entryEmail === normalizedEmail;
      });
      return normalizeString(
        matched?.verificationUrl
        || matched?.emailVerificationUrl
        || matched?.url
        || matched?.fetchUrl
        || matched?.codeUrl
        || matched?.queryUrl
        || ''
      );
    }

    async function executeNo2faFreeRoute(state = {}) {
      throwIfStopped();
      const latestState = {
        ...(await getState().catch(() => ({}))),
        ...(state || {}),
      };
      await addStepLog('免 2FA Free 路线：第 5 步完成，开始读取邮箱、取码链接和 AT。', 'info');
      if (typeof readCurrentChatGptSessionForExport !== 'function') {
        throw new Error('免 2FA Free 路线缺少 ChatGPT session 读取能力。');
      }
      if (typeof checkRegistrationUpiTrialEligibility !== 'function') {
        throw new Error('免 2FA Free 路线缺少 UPI 试用资格检测能力。');
      }

      const sessionResult = await readCurrentChatGptSessionForExport();
      const session = sessionResult?.session || {};
      const accessToken = normalizeString(sessionResult?.accessToken || session?.accessToken);
      const email = getSessionEmail(session)
        || normalizeEmail(latestState.email)
        || normalizeEmail(latestState.registrationEmailState?.current)
        || normalizeEmail(latestState.selectedCustomEmailPoolEmail);
      if (!email) {
        throw new Error('免 2FA Free 路线未读取到当前 ChatGPT 邮箱。');
      }
      if (!accessToken) {
        throw new Error(`免 2FA Free 路线未读取到 ${email} 的 AT，账号未进入 Free。`);
      }

      const verificationUrl = resolveVerificationUrl(latestState, email);
      if (!verificationUrl) {
        throw new Error(`免 2FA Free 路线未找到 ${email} 的邮箱取码链接，账号未进入 Free。`);
      }

      const recordedAt = normalizeTimestamp(latestState.no2faFreeRecordedAt);
      await setState({
        email,
        verificationUrl,
        no2faFreeRecordedAt: recordedAt,
        upiRedeemAccessToken: accessToken,
      });

      const eligibility = await checkRegistrationUpiTrialEligibility({
        state: latestState,
        email,
        session,
        accessToken,
        visibleStep: 6,
        patch: {
          email,
          verificationUrl,
          recordedAt,
          no2faFreeRoute: true,
          twoFactorEnabled: false,
          password: '',
          gptPassword: '',
          totpMfaSecret: '',
        },
      });
      if (!eligibility?.eligible) {
        throw new Error(`免 2FA Free 路线：账号未通过 UPI 试用资格检测，未进入 Free：${eligibility?.reason || '未知原因'}`);
      }

      await addStepLog(`免 2FA Free 路线：已检测到 UPI 试用资格，写入 Free：${email}。`, 'ok');
      await completeNodeFromBackground('persist-no-2fa-free', {
        email,
        accessToken,
        verificationUrl,
        recordedAt,
        trialEligibilityStatus: 'eligible',
      });
      return eligibility;
    }

    return {
      executeNo2faFreeRoute,
      resolveVerificationUrl,
    };
  }

  return {
    createNo2faFreeRouteExecutor,
  };
});
