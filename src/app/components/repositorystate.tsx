'use client';

import { Repo } from "../models/gitinfo";

/*
 * リポジトリ状態と操作
 */
export function RepositoryState({
  loading,
  repo,
  selectRepo,
  gitBranch,
  gitStatusAhead,
  gitStatusBehind,
  gitStatusList,
  commitmessage,
  setCommitMessage,
  handleGitReset,
  handleGitCommit,
  handleGitPush,
  handleGitPull,
  handleGitRebase,
}: {
  loading: boolean;
  repo: Repo | undefined;
  selectRepo: string;
  gitBranch: string;
  gitStatusAhead: number;
  gitStatusBehind: number;
  gitStatusList: { path: string; index: string, working_dir: string }[];
  commitmessage: string;
  setCommitMessage: (value: string) => void;
  handleGitReset: (gitinfostr:string) => void;
  handleGitCommit: (gitinfostr:string, commitmessage:string) => void;
  handleGitPush: (gitinfostr:string) => void;
  handleGitPull: (gitinfostr:string) => void;
  handleGitRebase: (gitinfostr:string) => void;
}) {
  return (

            <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">📕{repo?.name}</h2>
              <p>{"ブランチ: "+gitBranch}</p>
              <p>{"同期状況: "+gitStatusAhead+"進み "+gitStatusBehind+"遅れ"}</p>
              {gitStatusList.length > 0 ? (
                <div>
                  <p>{"変更:"+gitStatusList.length + "ファイル"}</p>
                  <input
                    type="text"
                    value={commitmessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="commitメッセージ"
                    className="flex-grow w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading} 
                  />
                </div>
                ):(null)}

              <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
                
                {gitBranch == "(no" && gitStatusList.length == 0 ? (
                  <div>
                  {/* リベース */}
                    <button
                      onClick={() => handleGitRebase(selectRepo)}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-blue-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      解決
                    </button>
                  </div>
                  ):(null)}

                {gitStatusList.length > 0 ? (
                <div>
                {/* リセット */}
                  <button
                    onClick={() => handleGitReset(selectRepo)}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    戻す
                  </button>

                {/* コミット */}
                  <button
                    onClick={() => handleGitCommit( selectRepo, commitmessage )}
                    disabled={loading || commitmessage.length == 0 }
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <div>
                {/* PUSH */}
                  <button
                    onClick={() => handleGitPush( selectRepo )}
                    disabled={loading || gitStatusAhead == 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    📕➡︎☁️
                  </button>
                {/* PULL */}
                  <button
                    onClick={() => handleGitPull( selectRepo )}
                    disabled={loading || gitStatusBehind == 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    ☁️➡︎📕
                  </button>
                </div>
              )}

            </div>

            </div>    
  );
}

