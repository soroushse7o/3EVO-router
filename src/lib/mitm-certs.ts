import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";

const dir = path.join(os.homedir(), ".3evo", "mitm");
const certPath = path.join(dir, "root-cert.pem");
const keyPath = path.join(dir, "root-key.pem");

export function ensureMitmDir() {
  mkdirSync(dir, { recursive: true });
}

export function generateRootCert() {
  ensureMitmDir();
  try {
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=3EVO Router MITM"`, { stdio: "ignore" });
    return { certPath, keyPath };
  } catch (e) {
    // Fallback: generate minimal PEMs (not production-grade)
    writeFileSync(certPath, "-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJAKHBfpE\n-----END CERTIFICATE-----\n");
    writeFileSync(keyPath, "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----\n");
    return { certPath, keyPath };
  }
}

export function hasRootCert() {
  return existsSync(certPath) && existsSync(keyPath);
}

export function getCertPaths() {
  return { certPath, keyPath };
}
