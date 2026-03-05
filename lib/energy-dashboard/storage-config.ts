import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_RELATIVE_DIR = 'data';
const CONFIG_FILE_NAME = 'storage-config.json';

function getDefaultAppDataDir(): string {
  return path.join(process.cwd(), DEFAULT_RELATIVE_DIR);
}

async function ensureDirectory(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function readConfigFile(): Promise<{ baseDir?: string } | null> {
  const configDir = getDefaultAppDataDir();
  const configPath = path.join(configDir, CONFIG_FILE_NAME);

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return null;
    }
    console.error('Error reading storage config:', error);
    return null;
  }
}

async function resolveBaseDirFromConfig(): Promise<string | null> {
  const config = await readConfigFile();
  if (config?.baseDir) {
    const resolved = path.resolve(config.baseDir);
    await ensureDirectory(resolved);
    return resolved;
  }
  return null;
}

export async function getStorageBaseDir(): Promise<string> {
  const envDir = process.env.ENERGY_DASHBOARD_DATA_DIR;
  if (envDir) {
    const resolvedEnv = path.resolve(envDir);
    await ensureDirectory(resolvedEnv);
    return resolvedEnv;
  }

  const configDir = getDefaultAppDataDir();
  await ensureDirectory(configDir);

  const configured = await resolveBaseDirFromConfig();
  if (configured) {
    return configured;
  }

  return configDir;
}

export async function setStorageBaseDir(baseDir: string): Promise<string> {
  const resolved = path.resolve(baseDir);
  await ensureDirectory(resolved);

  const configDir = getDefaultAppDataDir();
  await ensureDirectory(configDir);
  const configPath = path.join(configDir, CONFIG_FILE_NAME);

  const payload = {
    baseDir: resolved,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(configPath, JSON.stringify(payload, null, 2));
  return resolved;
}

export async function getStorageConfig(): Promise<{ baseDir: string }> {
  const baseDir = await getStorageBaseDir();
  return { baseDir };
}
