const fs = require('fs');
const path = require('path');

const CONFIG_FILE_NAME = 'genctx.config.json';
const LEGACY_CONFIG_FILE_NAME = 'genctx.json';

const DEFAULT_CONFIG = {
  include: ['**/*'],
  exclude: [
    'node_modules', '.git',
    'dist', 'build', 'out', 'target', 'vendor', 'bin', '.next', '.nuxt',
    '.venv', 'venv',
    '.env', '.env.*'
  ],
  outputFile: 'genctx.context.md',
  options: {
    removeComments: false,
    removeEmptyLines: false,
    maxFileSizeKB: 2048,
    maxTotalTokens: 0,
    maxFileTokens: 0,
    useGitignore: true
  }
};

const INTERNAL_EXCLUDES = [
  '*.png', '*.jpg', '*.jpeg', '*.gif', '*.ico', '*.svg',
  '*.mp4', '*.mp3', '*.pdf',
  '*.zip', '*.tar', '*.gz', '*.7z', '*.rar',
  '*.exe', '*.dll', '*.so', '*.dylib', '*.bin',
  '*.sqlite', '*.db',
  '.DS_Store', 'Thumbs.db',
  '.idea', '.vscode', '.vs',
  '.gitignore', '.gitattributes', '.npmignore', '.dockerignore', '.editorconfig', '.eslint*', '.prettier*',
  '*.pem', '*.key', '*.cert', '*.pfx', '*.p12', 'id_rsa', 'id_dsa',
  '__pycache__', '*.pyc', '*.pyo', '*.pyd', '.pytest_cache', '.cache', '.parcel-cache',
  '*.log', 'npm-debug.log', 'yarn-error.log', 'pnpm-debug.log',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'Gemfile.lock', 'Cargo.lock', 'go.sum',
  'genctx.config.json', 'genctx.context.md'
];

const PRESETS = {
  nodejs: { exclude: [] },
  python: { exclude: ['requirements.txt'] },
};

function loadConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  const legacyConfigPath = path.join(process.cwd(), LEGACY_CONFIG_FILE_NAME);

  if (fs.existsSync(configPath)) {
    return parseConfigFile(configPath, CONFIG_FILE_NAME);
  } else if (fs.existsSync(legacyConfigPath)) {
    const legacy = parseConfigFile(legacyConfigPath, LEGACY_CONFIG_FILE_NAME);
    if (!legacy) return null;
    return migrateLegacyConfig(legacy);
  }
  return null;
}

function migrateLegacyConfig(legacy) {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  // Map legacy include paths
  if (legacy.includePaths && legacy.includePaths.length > 0) {
    config.include = legacy.includePaths.map(p => {
      const clean = p.replace(/\/$/, "");
      return `${clean}/**/*`;
    });
  }

  // Map legacy extensions
  if (legacy.includeExtensions && legacy.includeExtensions.length > 0) {
    const extPattern = legacy.includeExtensions.map(e => e.replace(/^\./, "")).join(',');
    config.include = config.include.map(pattern => {
      if (pattern.endsWith('**/*')) {
        return pattern.replace('**/*', `**/*.{${extPattern}}`);
      }
      return pattern;
    });
  }

  // Map excludes
  if (legacy.excludePaths) {
    config.exclude = [...new Set([...config.exclude, ...legacy.excludePaths])];
  }

  // Map options
  if (legacy.outputFile) config.outputFile = legacy.outputFile;
  if (legacy.removeComments) config.options.removeComments = legacy.removeComments;
  if (legacy.removeEmptyLines) config.options.removeEmptyLines = legacy.removeEmptyLines;
  if (legacy.maxFileSizeKB) config.options.maxFileSizeKB = legacy.maxFileSizeKB;

  return config;
}

function parseConfigFile(fullPath, fileName) {
  if (fs.existsSync(fullPath)) {
    try {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (e) {
      console.warn(`⚠️ Could not parse ${fileName}. Using defaults. Error: ${e.message}`);
      return null;
    }
  }
  return null;
}

function saveConfig(config) {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`💾 Configuration updated in ${CONFIG_FILE_NAME}`);
  } catch (e) {
    console.error(`❌ Error saving configuration: ${e.message}`);
  }
}

module.exports = {
  DEFAULT_CONFIG,
  INTERNAL_EXCLUDES,
  PRESETS,
  loadConfig,
  saveConfig
};