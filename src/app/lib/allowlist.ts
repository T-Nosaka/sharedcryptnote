import fs from 'fs';

// ALLOWUSERS 環境変数で指定されたJSONファイルに記載のメールアドレスのみ利用可とする。
// 未設定の場合は制限なし（従来通り誰でもGoogleログイン可）。
// JSON形式: メアドの配列 ["a@example.com", ...]
//   または { "users": [...] } / { "allowedUsers": [...] } / { "emails": [...] }
// 比較は小文字化・前後空白除去して行う。

let cachedEmails: Set<string> | null = null;
let cachedMtimeMs = 0;
let cachedPath = '';

function loadAllowList(): Set<string> | null {
  // 戻り値 null = 制限なし。Set = 許可集合（空Setは全員拒否）。
  const filePath = (process.env.ALLOWUSERS ?? '').trim();
  if (!filePath) {
    return null;
  }
  try {
    const stat = fs.statSync(filePath);
    if (cachedEmails !== null && cachedPath === filePath && stat.mtimeMs === cachedMtimeMs) {
      return cachedEmails;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    let list: unknown = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      list = obj.users ?? obj.allowedUsers ?? obj.allowUsers ?? obj.emails ?? [];
    }
    const emails = new Set<string>();
    if (Array.isArray(list)) {
      for (const entry of list) {
        if (typeof entry === 'string') {
          const mail = entry.trim().toLowerCase();
          if (mail) {
            emails.add(mail);
          }
        }
      }
    }
    cachedEmails = emails;
    cachedMtimeMs = stat.mtimeMs;
    cachedPath = filePath;
    console.log('[allowlist] loaded ' + emails.size + ' adresse(s) from ' + filePath);
    return emails;
  } catch (err) {
    // fail-closed: 設定はあるのに読めない/壊れている場合は誰も通さない
    console.error('[allowlist] failed to load ' + filePath + ':', err);
    return new Set<string>();
  }
}

/** ALLOWUSERS による制限が有効か */
export function isAllowListEnabled(): boolean {
  return (process.env.ALLOWUSERS ?? '').trim().length > 0;
}

/** このメアドの利用可否。ALLOWUSERS未設定なら常に true */
export function isEmailAllowed(email?: string | null): boolean {
  const allow = loadAllowList();
  if (allow === null) {
    return true;
  }
  if (!email) {
    return false;
  }
  return allow.has(email.trim().toLowerCase());
}
