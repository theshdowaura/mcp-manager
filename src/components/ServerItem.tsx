import { McpServerTemplate, EnvInputs } from '../types';

interface ServerItemProps {
  template: McpServerTemplate;
  selectedPath: Record<string, string>;
  envInputs: EnvInputs;
  onSelectDirectory: (name: string) => void;
  onEnvInput: (serverName: string, key: string, value: string) => void;
  onInstallServer: (template: McpServerTemplate) => void;
}

export function ServerItem({
  template,
  selectedPath,
  envInputs,
  onSelectDirectory,
  onEnvInput,
  onInstallServer,
}: ServerItemProps) {
  return (
    <div className="provider-item">
      <div className="provider-header">
        <div>
          <h4>{template.name}</h4>
          <p className="description">{template.description}</p>
        </div>
        {template.installed ? (
          <div className="installed-badge">已安装</div>
        ) : null}
      </div>

      <div className="provider-content">
        <div className="command-info">
          <p><strong>Command:</strong> {template.command}</p>
          <p><strong>Args:</strong> {template.args.map((arg) =>
            arg === "/Users/default/Desktop" && template.name === "filesystem"
              ? selectedPath[template.name] || arg
              : arg
          ).join(" ")}</p>
        </div>

        {template.name === "filesystem" && (
          <div className="path-selector">
            <p>选择目录:</p>
            <div className="path-input-group">
              <input
                type="text"
                value={selectedPath[template.name] || "/Users/default/Desktop"}
                readOnly
                placeholder="点击选择目录"
              />
              <button
                className="select-button"
                onClick={() => onSelectDirectory(template.name)}
              >
                选择
              </button>
            </div>
          </div>
        )}

        {template.env && (
          <div className="env-inputs">
            <p><strong>环境变量配置</strong></p>
            {Object.entries(template.env).map(([key, defaultValue]) => (
              <div key={key} className="env-input-group">
                <label htmlFor={`${template.name}_${key}`}>{key}:</label>
                <input
                  type="text"
                  id={`${template.name}_${key}`}
                  placeholder={defaultValue}
                  value={envInputs[`${template.name}_${key}`] || ""}
                  onChange={(e) => onEnvInput(template.name, key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {!template.installed && (
          <button
            className="install-button"
            onClick={() => onInstallServer(template)}
            disabled={
              template.env &&
              Object.keys(template.env).some(
                (key) => !envInputs[`${template.name}_${key}`]
              )
            }
          >
            安装此 Server
          </button>
        )}
      </div>
    </div>
  );
} 