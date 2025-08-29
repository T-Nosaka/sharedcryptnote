'use client';

import React from 'react';

/*
 * リポジトリ一覧
 */
export function RepositorySection({
  loading,
  repoList,
  repoUrl,
  repoName,
  sshkey,
  setRepoUrl,
  setRepoName,
  setSshkey,
  handleRepoSelect,
  handleRepoDelete,
  handleClone,
}: {
  loading: boolean;
  repoList: { name: string; isDirectory: boolean }[];
  repoUrl: string;
  repoName: string;
  sshkey: string;
  setRepoUrl: (value: string) => void;
  setRepoName: (value: string) => void;
  setSshkey: (value: string) => void;
  handleRepoSelect: (entry: { name: string; isDirectory: boolean }) => void;
  handleRepoDelete: (reponame: string) => void;
  handleClone: (repoUrl: string, name: string, sshkey: string) => void;
}) {
  return (
         
          <div className="w-full" style={{maxWidth:600}}>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 w-full max-w-xl"  style={{maxWidth:600}}>
              <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg"  style={{maxWidth:600}}>
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Repository</h2>
                  {repoList.length > 0 ? (
                  <ul className="list-none p-0">
                    {repoList.map(entry => (
                      <li
                        key={entry.name}
                        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                      >
                        <span
                          className="text-yellow-400"
                          onClick={() => { if (!loading) handleRepoSelect(entry);}}>
                          📕
                        </span>
                        <span
                          className="text-white"
                          onClick={() => { if (!loading) handleRepoSelect(entry);}}>
                          {entry.name}
                        </span>

                        <div className="flex items-center space-x-2 ml-auto">
                          <button
                            className="text-red-500 hover:text-red-700 justify-end"
                            disabled={loading}
                            onClick={() => { if (!loading) handleRepoDelete(entry.name);}}
                            title={`${entry.name}を削除`}
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  ) : (
                    <p className="text-gray-400">Git Clone して下さい</p>
                  )}
              </div>
            </div>

            <details className="w-full mb-4 border border-gray-700 rounded-lg" style={{maxWidth:600}}>
              <summary className="cursor-pointer p-4 font-semibold text-blue-300 hover:bg-gray-800 rounded-t-lg">
                Git Clone
              </summary>

              <div className="flex flex-col items-center space-y-4 p-4 border-t border-gray-700">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="GitリポジリのURLを入力"
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="リポジリ名Lを入力"
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <textarea
                  value={sshkey}
                  onChange={(e) => setSshkey(e.target.value)}
                  placeholder="必要な場合、SSHキーを入力（複数行可）"
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  disabled={loading}
                  rows={4}
                />
                <button
                  onClick={() => handleClone(repoUrl, repoName, sshkey)}
                  disabled={loading || !repoUrl || !repoName}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Cloning...' : 'Clone'}
                </button>
              </div>

            </details>

          </div>
  );
}

