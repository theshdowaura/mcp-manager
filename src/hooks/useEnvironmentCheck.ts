import { useCallback, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { EnvCheckResult, ClaudeCheckResult } from '../types';

interface InstallResult {
  success: boolean;
  pythonPath: string;
  nodePath: string;
  uvPath: string;
  message?: string;
}

export function useEnvironmentCheck() {
  const [installing, setInstalling] = useState<Record<string, boolean>>({
    python: false,
    node: false,
    uv: false,
    claude: false
  });
  const [installMessage, setInstallMessage] = useState('');

  const checkEnvironments = useCallback(async () => {
    try {
      const python = await invoke<EnvCheckResult>("get_python_path");
      const node = await invoke<EnvCheckResult>("get_node_path");
      const uv = await invoke<EnvCheckResult>("get_uv_path");

      return {
        pythonPath: python.version,
        nodePath: node.version,
        uvPath: uv.version,
      };
    } catch (error) {
      console.error("Error checking environments:", error);
      return {
        pythonPath: "",
        nodePath: "",
        uvPath: "",
      };
    }
  }, []);

  const checkClaudeInstalled = useCallback(async () => {
    try {
      const status = await invoke<ClaudeCheckResult>("check_claude_installed");
      return status.is_installed ? "已安装" : "未安装";
    } catch (error) {
      console.error("Error checking Claude installation:", error);
      return "未安装";
    }
  }, []);

  const handleInstall = useCallback(async (type: string): Promise<InstallResult> => {
    try {
      setInstalling(prev => ({ ...prev, [type]: true }));
      setInstallMessage('正在安装...');
      
      if (type === "claude") {
        await openUrl("https://claude.ai/download");
        setInstallMessage("已打开 Claude 下载页面");
        
        setTimeout(() => {
          setInstallMessage('');
          setInstalling(prev => ({ ...prev, [type]: false }));
        }, 3000);
        
        return {
          success: true,
          pythonPath: "",
          nodePath: "",
          uvPath: "",
          message: "已打开 Claude 下载页面"
        };
      }

      const result = await invoke<EnvCheckResult>("install_environment", {
        envType: type,
      });

      if (result.is_installed) {
        setInstallMessage(result.version);
        setTimeout(() => {
          setInstallMessage('');
          setInstalling(prev => ({ ...prev, [type]: false }));
        }, 3000);
      } else {
        setInstallMessage("安装失败");
        setTimeout(() => {
          setInstallMessage('');
          setInstalling(prev => ({ ...prev, [type]: false }));
        }, 5000);
      }
      
      return {
        success: result.is_installed,
        pythonPath: type === "python" ? result.version : "",
        nodePath: type === "node" ? result.version : "",
        uvPath: type === "uv" ? result.version : "",
        message: result.version
      };
    } catch (error) {
      const errorMessage = `安装失败: ${error}`;
      setInstallMessage(errorMessage);
      
      setTimeout(() => {
        setInstallMessage('');
        setInstalling(prev => ({ ...prev, [type]: false }));
      }, 5000);
      
      return {
        success: false,
        pythonPath: "",
        nodePath: "",
        uvPath: "",
        message: errorMessage
      };
    }
  }, []);

  return {
    checkEnvironments,
    checkClaudeInstalled,
    handleInstall,
    installing,
    installMessage,
  };
} 