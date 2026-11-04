import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const DATA_DIR = path.join(os.homedir(), ".3evo");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

function getMasterKey() {
  const keyPath = path.join(DATA_DIR, "master.key");
  if (!fs.existsSync(keyPath)) {
    throw new Error("Master key not found. Run the server once to generate it.");
  }
  return fs.readFileSync(keyPath);
}

function encrypt(data, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(salt);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]);
}

function decrypt(data, key) {
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(salt);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

async function createBackup(outputPath) {
  console.log("Creating backup...");

  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }

  const key = getMasterKey();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = outputPath || path.join(BACKUP_DIR, `3evo-backup-${timestamp}.enc`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const files = [];
  const entries = [];

  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (path.basename(item) === "backups") continue;
        walkDir(fullPath);
      } else {
        files.push(fullPath);
        const content = fs.readFileSync(fullPath);
        const header = `${fullPath}\t${content.length}\n`;
        entries.push(Buffer.from(header), content);
      }
    }
  }

  walkDir(DATA_DIR);

  const archive = Buffer.concat(entries);
  console.log(`  Files: ${files.length}`);
  console.log(`  Size: ${(archive.length / 1024).toFixed(1)} KB`);

  const encrypted = encrypt(archive, key);
  fs.writeFileSync(backupFile, encrypted);

  console.log(`  Backup saved: ${backupFile}`);
  console.log(`  Encrypted size: ${(encrypted.length / 1024).toFixed(1)} KB`);
}

async function restoreBackup(backupPath) {
  console.log("Restoring backup...");

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const key = getMasterKey();
  const encrypted = fs.readFileSync(backupPath);
  const archive = decrypt(encrypted, key);

  let offset = 0;
  const restored = [];

  while (offset < archive.length) {
    const newline = archive.indexOf("\n", offset);
    if (newline === -1) break;

    const header = archive.subarray(offset, newline).toString();
    const [filePath, fileSizeStr] = header.split("\t");
    const fileSize = parseInt(fileSizeStr, 10);

    offset = newline + 1;
    const content = archive.subarray(offset, offset + fileSize);
    offset += fileSize;

    const fullPath = path.join(DATA_DIR, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
    restored.push(filePath);
  }

  console.log(`  Restored ${restored.length} files`);
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("No backups found.");
    return;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".enc"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("No backups found.");
    return;
  }

  console.log(`\nAvailable backups (${files.length}):`);
  for (const file of files) {
    const fullPath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(fullPath);
    const size = (stat.size / 1024).toFixed(1);
    const date = stat.mtime.toLocaleString();
    console.log(`  ${file}  ${size} KB  ${date}`);
  }
}

const command = process.argv[2];
const backupPath = process.argv[3];

try {
  switch (command) {
    case "create":
      await createBackup(backupPath);
      break;
    case "restore":
      await restoreBackup(backupPath);
      break;
    case "list":
      await listBackups();
      break;
    default:
      console.log(`
3EVO Router Backup Utility

Usage:
  node scripts/backup.js create [output.enc]   Create encrypted backup
  node scripts/backup.js restore <backup.enc>  Restore from backup
  node scripts/backup.js list                   List available backups
`);
  }
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
}
