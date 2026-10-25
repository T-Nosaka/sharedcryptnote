import path from "path";

// Gitリポジトリを保存するディレクトリ  mkdir -p /git-repos && chmod 777 /git-repos
export const REPO_DIR = '/git-repos';

export const SSH_KEY = '~/.ssh/jstest1.key'

// 例えば、.txt, .md, .js, .tsなどのテキストファイルを編集対象とする
export const editableExtensions = ['.chi', '.txt'];

export const textExtensions = ['.txt'];
export const encryptExtensions = ['.chi'];

// サポートする文字コードのリスト
export const supportedEncodings = ['utf-8', 'shift-jis', 'euc-jp']; // Node.jsでサポートされるものに合わせて調整

export const DEFAULTENCODE='utf-8'

// ブラウザ環境でNode.jsの'path'モジュールが使えないため、簡易的なパス結合関数を定義
export const pathJoin = (base: string, part: string): string => {
  if (!base) return part;
  if (!part) return base;
  // '/'で終わるパスと'/'で始まるパスを適切に結合
  return path.join(base,part);
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Phase1 crypto settings (.chi dual-format SNC1/BF01).
export type SncWriteMode = 'snc1' | 'bf01';

// Default write mode for .chi, configurable via env (snc1 | bf01).
export function getDefaultWriteMode(): SncWriteMode {
  const raw = (typeof process !== 'undefined' ? (process.env.CRYPTO_DEFAULT_MODE || 'snc1') : 'snc1');
  const v = raw.trim().toLowerCase();
  return v === 'bf01' ? 'bf01' : 'snc1';
}

// Per-request override (encrypt/put accept optional mode), falls back to env default.
export function resolveWriteMode(mode: unknown): SncWriteMode {
  if (typeof mode === 'string') {
    const v = mode.trim().toLowerCase();
    if (v === 'bf01' || v === 'snc1') return v;
  }
  return getDefaultWriteMode();
}

// Printable ASCII only (0x20-0x7E). Full-width and non-ASCII passwords are rejected.
export function isAsciiPassword(pw: string): boolean {
  return /^[\x20-\x7E]*$/.test(pw);
}

// Minimum password length, configurable via env. Hard floor 4, default 8, cap 64.
// Server reads CRYPTO_PASSWORD_MIN_LENGTH at runtime; browser bundle reads
// NEXT_PUBLIC_CRYPTO_PASSWORD_MIN_LENGTH at build time. Set both to the same value.
export function getPasswordMinLength(): number {
  const raw = (typeof process !== 'undefined'
    ? (process.env.CRYPTO_PASSWORD_MIN_LENGTH
      ?? process.env.NEXT_PUBLIC_CRYPTO_PASSWORD_MIN_LENGTH
      ?? '8')
    : '8');
  const n = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n)) return 8;
  return Math.min(64, Math.max(4, Math.floor(n)));
}
