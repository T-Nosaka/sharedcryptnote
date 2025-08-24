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
