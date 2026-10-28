import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();

const INPUT_FOLDERS = [
  path.join(ROOT, 'public', 'templates', 'rank-common-4k'),
  path.join(ROOT, 'public', 'rank-assets'),
  path.join(ROOT, 'public', 'assets', 'categories'),
];

const OUTPUT_ROOT = path.join(
  ROOT,
  'public',
  'optimized-images'
);

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png']);

async function walk(folder) {
  let entries;

  try {
    entries = await fs.readdir(folder, {
      withFileTypes: true,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Folder nahi mila: ${folder}`);
      return [];
    }

    throw error;
  }

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (
      entry.isFile() &&
      SUPPORTED.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimizeFile(sourcePath, inputRoot) {
  const relativePath = path.relative(
    inputRoot,
    sourcePath
  );

  const outputFolder = path.join(
    OUTPUT_ROOT,
    path.basename(inputRoot),
    path.dirname(relativePath)
  );

  const outputPath = path.join(
    outputFolder,
    `${path.basename(
      sourcePath,
      path.extname(sourcePath)
    )}.webp`
  );

  await fs.mkdir(outputFolder, {
    recursive: true,
  });

  const source = sharp(sourcePath, {
    failOn: 'error',
  });

  const metadata = await source.metadata();

  // Original dimensions preserve karo.
  // Koi resize nahi hoga.
  const pipeline =
    metadata.format === 'png'
      ? source.webp({
          lossless: true,
          effort: 5,
          alphaQuality: 100,
        })
      : source.webp({
          quality: 92,
          effort: 5,
          smartSubsample: true,
        });

  await pipeline.toFile(outputPath);

  const [original, optimized] = await Promise.all([
    fs.stat(sourcePath),
    fs.stat(outputPath),
  ]);

  const saving = original.size
    ? (
        (1 - optimized.size / original.size) * 100
      ).toFixed(1)
    : '0.0';

  console.log(
    `Optimized: ${path.relative(ROOT, outputPath)} | ` +
    `${metadata.width}x${metadata.height} | ` +
    `${saving}% size change`
  );
}

async function main() {
  await fs.mkdir(OUTPUT_ROOT, {
    recursive: true,
  });

  let total = 0;

  for (const folder of INPUT_FOLDERS) {
    const files = await walk(folder);

    console.log(
      `\nFolder: ${path.relative(ROOT, folder)} ` +
      `(${files.length} images)`
    );

    for (const file of files) {
      try {
        await optimizeFile(file, folder);
        total++;
      } catch (error) {
        console.error(
          `Error in ${file}:`,
          error.message
        );
      }
    }
  }

  console.log(
    `\nDone! ${total} optimized copies created.`
  );

  console.log(
    'Original images safe hain; unhe modify nahi kiya gaya.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});