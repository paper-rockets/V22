import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('Running smoke test...');

if (!fs.existsSync(path.join(rootDir, 'index.html'))) {
  console.error('Missing index.html');
  process.exit(1);
}

if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error('Missing package.json');
  process.exit(1);
}

const studioEngine = fs.readFileSync(path.join(rootDir, 'src/core/studioEngine.ts'), 'utf8');
const strokePipeline = fs.readFileSync(path.join(rootDir, 'src/core/strokePipeline.ts'), 'utf8');
const transformController = fs.readFileSync(path.join(rootDir, 'src/core/transformController.ts'), 'utf8');
const deviceProfile = fs.readFileSync(path.join(rootDir, 'src/utils/deviceProfile.ts'), 'utf8');

const requiredPatterns = [
  [studioEngine, /transparencyMode:[^=]+=[^;]*'wboit'/, 'Hybrid WBOIT must be the startup transparency mode'],
  [studioEngine, /transparencyDiagnosticsEnabled\s*=\s*isDiagnosticsEnabled\(\)/, 'Diagnostics must be explicitly gated'],
  [studioEngine, /coverageFraction\s*<\s*0\.75/, 'Broad scissor rectangles must be bypassed'],
  [studioEngine, /hasSavedEngineSceneBackground/, 'Live-camera background restoration sentinel is missing'],
  [strokePipeline, /markTransparencyDirty:\s*\(\)\s*=>\s*void/, 'Stroke mutations must invalidate transparency'],
  [strokePipeline, /invalidateTransparencyScissor:\s*\(\)\s*=>\s*void/, 'Active geometry must invalidate the scissor cache'],
  [transformController, /markTransparencyDirty:\s*\(\)\s*=>\s*void/, 'Stroke transforms must invalidate transparency'],
  [deviceProfile, /tier === 'low'[\s\S]*?wboit:\s*true/, 'Low-tier devices must allow the hybrid WBOIT path'],
];

for (const [source, pattern, message] of requiredPatterns) {
  if (!pattern.test(source)) {
    console.error(message);
    process.exit(1);
  }
}

console.log('Smoke test passed successfully.');
