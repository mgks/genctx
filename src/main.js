const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { DEFAULT_CONFIG, PRESETS, loadConfig, saveConfig } = require('./config');
const { generateContextFile } = require('./generator');

// Format JSON config with grouped excludes for readability
function formatPrettyConfig(config) {
  let json = JSON.stringify(config, null, 2);
  const excludeRegex = /"exclude": \[\s*([\s\S]*?)\s*\]/;
  const match = json.match(excludeRegex);

  if (match) {
    const rawContent = match[1];
    const items = rawContent.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);

    const groups = {
      sys: [], sec: [], build: [], lang: [], files: []
    };

    items.forEach(item => {
      const i = item.toLowerCase();
      if (['node_modules', '.git'].includes(i)) groups.sys.push(item);
      else if (i.startsWith('.env')) groups.sec.push(item);
      else if (['dist', 'build', 'out', 'target', 'vendor', 'bin', '.next', '.nuxt'].includes(i)) groups.build.push(item);
      else if (['.venv', 'venv'].includes(item)) groups.lang.push(item);
      else groups.files.push(item);
    });

    const lines = [];
    if (groups.sys.length) lines.push(groups.sys);
    if (groups.sec.length) lines.push(groups.sec);
    if (groups.build.length) lines.push(groups.build);
    if (groups.lang.length) lines.push(groups.lang);
    if (groups.files.length) lines.push(groups.files);

    const newContent = lines.map((grp, idx) => {
      const isLast = idx === lines.length - 1;
      return `\n    ${grp.map(x => `"${x}"`).join(', ')}${isLast ? '' : ','}`;
    }).join('');

    json = json.replace(excludeRegex, `"exclude": [${newContent}\n  ]`);
  }
  return json;
}

function applyCliModifications(currentConfig, argv) {
  let modified = false;
  const newConfig = JSON.parse(JSON.stringify(currentConfig));
  const mergeUnique = (target, source) => [...new Set([...target, ...source])];

  // Presets
  if (argv.preset && argv.preset.length > 0) {
    argv.preset.forEach(p => {
      if (PRESETS[p]) {
        if (PRESETS[p].exclude) {
          newConfig.exclude = mergeUnique(newConfig.exclude, PRESETS[p].exclude);
          modified = true;
        }
        if (PRESETS[p].include) {
          newConfig.include = mergeUnique(newConfig.include, PRESETS[p].include);
          modified = true;
        }
      } else {
        console.warn(`⚠️ Warning: Preset '${p}' not found.`);
      }
    });
  }

  // Excludes
  if (argv.addExclude) {
    newConfig.exclude = mergeUnique(newConfig.exclude, argv.addExclude);
    modified = true;
  }
  if (argv.removeExclude) {
    const toRemove = new Set(argv.removeExclude);
    newConfig.exclude = newConfig.exclude.filter(p => !toRemove.has(p));
    modified = true;
  }

  // Includes / Extensions
  if (argv.addExt) {
    const extensions = argv.addExt.map(e => e.replace(/^\./, "")).join(',');
    newConfig.include.push(`**/*.{${extensions}}`);
    modified = true;
  }
  if (argv.include) {
    newConfig.include = mergeUnique(newConfig.include, argv.include);
    modified = true;
  }

  // Options
  if (argv.output && argv.output !== newConfig.outputFile) {
    newConfig.outputFile = argv.output;
    modified = true;
  }

  if (!newConfig.options) newConfig.options = {};

  if (argv.maxSize && argv.maxSize !== newConfig.options.maxFileSizeKB) {
    newConfig.options.maxFileSizeKB = argv.maxSize;
    modified = true;
  }
  if (argv.useGitignore !== undefined) {
    newConfig.options.useGitignore = argv.useGitignore;
    modified = true;
  }
  if (argv.removeComments !== undefined) {
    newConfig.options.removeComments = argv.removeComments;
    modified = true;
  }
  if (argv.removeEmptyLines !== undefined) {
    newConfig.options.removeEmptyLines = argv.removeEmptyLines;
    modified = true;
  }

  return { config: newConfig, modified };
}

async function run() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]\n\nGenerates optimized project context for AI.')
    // Management
    .option('reset', { describe: 'Reset configuration to defaults.', type: 'boolean' })
    .option('init', { describe: 'Initialize/Update config only.', type: 'boolean' })
    .option('debug', { describe: 'Show debug info.', type: 'boolean' })
    // Selection
    .option('preset', { alias: 'p', describe: 'Apply tech presets.', type: 'array' })
    .option('include', { alias: 'i', describe: 'Add include glob (e.g. src/**/*).', type: 'array' })
    .option('add-exclude', { alias: 'a', describe: 'Add exclude glob.', type: 'array' })
    .option('remove-exclude', { alias: 'r', describe: 'Remove exclude glob.', type: 'array' })
    .option('add-ext', { describe: 'Add extension glob (e.g. .ts).', type: 'array' })
    // Settings
    .option('output', { alias: 'o', describe: 'Output filename.', type: 'string' })
    .option('max-size', { describe: 'Max file size (KB).', type: 'number' })
    .option('use-gitignore', { describe: 'Respect .gitignore.', type: 'boolean' })
    // Optimizations
    .option('remove-comments', { describe: 'Strip code comments.', type: 'boolean' })
    .option('remove-empty-lines', { describe: 'Remove empty lines.', type: 'boolean' })
    .help()
    .alias('h', 'help')
    .argv;

  let config = loadConfig();
  let shouldSave = false;

  // Reset
  if (argv.reset) {
    console.log("🔄 Resetting configuration to defaults...");
    config = null;
  }

  // Initialize Default
  if (config === null) {
    console.log("...Auto-generating configuration file.");
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    const prettyConfig = formatPrettyConfig(config);
    const configPath = require('path').join(process.cwd(), 'genctx.config.json');
    require('fs').writeFileSync(configPath, prettyConfig);
    console.log(`💾 Configuration updated in genctx.config.json`);
    shouldSave = false;
  }

  // Apply CLI Flags
  const hasCliModifiers = argv.preset || argv.addExclude || argv.removeExclude || argv.addExt || argv.output || argv.maxSize || argv.useGitignore || argv.include || argv.removeComments || argv.removeEmptyLines;

  if (hasCliModifiers) {
    const { config: newConfig, modified } = applyCliModifications(config, argv);
    if (modified) {
      config = newConfig;
      shouldSave = true;
    }
  }

  if (shouldSave) saveConfig(config);

  if (argv.init) {
    console.log("✅ Configuration initialized/updated.");
    return;
  }

  await generateContextFile(config);
}

module.exports = { run };