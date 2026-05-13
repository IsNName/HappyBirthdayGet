const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov"]);

function encodePath(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

function scanFolder(folder, extensions) {
  const absoluteFolder = path.join(root, folder);

  if (!fs.existsSync(absoluteFolder)) {
    fs.mkdirSync(absoluteFolder, { recursive: true });
  }

  return fs
    .readdirSync(absoluteFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      if (!extensions.has(extension)) return null;

      const absolutePath = path.join(absoluteFolder, entry.name);
      const stats = fs.statSync(absolutePath);

      return {
        name: entry.name,
        src: encodePath(folder, entry.name),
        extension: extension.slice(1),
        size: stats.size,
        updatedAt: stats.mtime.toISOString()
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  images: scanFolder("img", imageExtensions),
  videos: scanFolder("video", videoExtensions)
};

fs.writeFileSync(
  path.join(root, "media-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(
  `Generated media-manifest.json with ${manifest.images.length} images and ${manifest.videos.length} videos.`
);
