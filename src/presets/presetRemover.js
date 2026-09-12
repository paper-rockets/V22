import fs from 'fs';
import path from 'path';

export function locatePreset(content, presetId) {
  const idRegex = new RegExp(`id:\\s*['"]${presetId}['"]`);
  const match = idRegex.exec(content);
  if (!match) return null;

  const idPos = match.index;
  let startBrace = -1;
  for (let i = idPos - 1; i >= 0; i--) {
    if (content[i] === '{') {
      startBrace = i;
      break;
    }
  }
  if (startBrace === -1) return null;

  let depth = 0;
  let inTemplate = false;
  let inDouble = false;
  let inSingle = false;
  let inLineComment = false;
  let inBlockComment = false;
  let endBrace = -1;

  for (let i = startBrace; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1] || '';
    const prevChar = i > 0 ? content[i - 1] : '';

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (!inTemplate && !inDouble && !inSingle) {
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }
    if (char === '`' && prevChar !== '\\' && !inDouble && !inSingle) {
      inTemplate = !inTemplate;
      continue;
    }
    if (char === '"' && prevChar !== '\\' && !inTemplate && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (char === "'" && prevChar !== '\\' && !inTemplate && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (!inTemplate && !inDouble && !inSingle) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
    }
  }

  if (endBrace === -1) return null;

  // Include trailing comma & whitespace
  let endPos = endBrace + 1;
  while (endPos < content.length && (content[endPos] === ' ' || content[endPos] === '\t')) {
    endPos++;
  }
  if (content[endPos] === ',') {
    endPos++;
  }
  while (endPos < content.length && (content[endPos] === ' ' || content[endPos] === '\t')) {
    endPos++;
  }
  if (content[endPos] === '\r') endPos++;
  if (content[endPos] === '\n') endPos++;

  return { start: startBrace, end: endPos };
}

export function removePresetsFromContent(content, presetIds) {
  let updated = content;
  const locations = [];
  for (const id of presetIds) {
    const loc = locatePreset(updated, id);
    if (loc) {
      locations.push({ id, ...loc });
    }
  }
  locations.sort((a, b) => b.start - a.start);

  for (const loc of locations) {
    updated = updated.slice(0, loc.start) + updated.slice(loc.end);
  }

  // Clean up any double commas or commas before closing brackets: [, or ,]
  updated = updated.replace(/,\s*,/g, ',');
  updated = updated.replace(/\[\s*,/g, '[');
  updated = updated.replace(/,\s*\]/g, ']');

  return { content: updated, count: locations.length, removedIds: locations.map(l => l.id) };
}

export function deletePresetsFromFiles(presetsDir, presetIds) {
  if (!fs.existsSync(presetsDir)) {
    throw new Error(`Presets directory not found: ${presetsDir}`);
  }

  const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.js') && f !== 'presetRemover.js');
  let totalDeleted = 0;
  const modifiedFiles = [];
  const actuallyRemoved = [];

  const backupDir = path.join(presetsDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const file of files) {
    const filePath = path.join(presetsDir, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');

    const result = removePresetsFromContent(originalContent, presetIds);
    if (result.count > 0) {
      // Create backup
      const backupPath = path.join(backupDir, `${file}.${timestamp}.bak`);
      fs.writeFileSync(backupPath, originalContent, 'utf8');

      // Write updated content
      fs.writeFileSync(filePath, result.content, 'utf8');
      totalDeleted += result.count;
      modifiedFiles.push({ file, count: result.count });
      actuallyRemoved.push(...result.removedIds);
    }
  }

  return {
    totalDeleted,
    modifiedFiles,
    actuallyRemoved,
    backupDir,
  };
}
