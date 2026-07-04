(function attachSidepanelSettingsTransferManager(globalScope) {
  function createSettingsTransferManager(context = {}) {
    const {
      controls = {},
      helpers = {},
      runtime = {},
    } = context;

    function setActionInFlight(value) {
      controls.setConfigActionInFlight?.(Boolean(value));
      controls.updateConfigMenuControls?.();
    }

    async function exportSettingsFile() {
      const saveTarget = await helpers.requestTextFileSaveTarget?.(
        `multipage-settings-${helpers.buildDownloadFileTimestamp?.()}.json`,
        'application/json;charset=utf-8'
      );
      if (saveTarget?.cancelled) {
        helpers.showToast?.('已取消导出配置。', 'info', 1800);
        return;
      }
      if (saveTarget?.error) {
        helpers.showToast?.('导出配置失败：' + (saveTarget.error?.message || '无法打开保存窗口。'), 'error');
        return;
      }

      helpers.closeConfigMenu?.();
      setActionInFlight(true);

      try {
        await helpers.flushPendingSettingsBeforeExport?.();
        const response = await runtime.sendMessage?.({
          type: 'EXPORT_SETTINGS',
          source: 'sidepanel',
          payload: {},
        });

        if (response?.error) {
          throw new Error(response.error);
        }
        if (!response?.fileContent || !response?.fileName) {
          throw new Error('未生成可下载的配置文件。');
        }

        const downloadResult = await helpers.downloadTextFile?.(
          response.fileContent,
          response.fileName,
          'application/json;charset=utf-8',
          { saveTarget }
        );
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出配置。', 'info', 1800);
          return;
        }
        helpers.showToast?.('配置已导出：' + (downloadResult?.fileName || response.fileName), 'success', 2200);
      } catch (error) {
        helpers.showToast?.('导出配置失败：' + (error?.message || error), 'error');
      } finally {
        setActionInFlight(false);
      }
    }

    return {
      exportSettingsFile,
    };
  }

  globalScope.SidepanelSettingsTransferManager = {
    createSettingsTransferManager,
  };
})(window);
