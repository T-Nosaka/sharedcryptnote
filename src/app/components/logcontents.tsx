'use client';

import React from 'react';
import { DefaultLogFields } from 'simple-git';
import { Repo } from '../models/gitinfo';

/*
 * ログ処理
 */
export function LogContents({
    loading,
    repo,
    loglist,
    setLoglist,
}:{
    loading: boolean;
    repo: Repo | undefined;
    loglist:ReadonlyArray<DefaultLogFields>
    setLoglist:(loglist:ReadonlyArray<DefaultLogFields>|undefined)=>void
}) {
  return (

    <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">📕{repo?.name}</h2>
        <div className="overflow-x-auto mt-4">
            <button
            onClick={() => setLoglist( undefined )}
            disabled={loading}
            className="w-full max-w-2xl px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              ⏏️ 戻る
            </button>

            <table className="min-w-full border-collapse border border-gray-700">
                <thead className="bg-gray-800">
                <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">名前</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">日付</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">コメント</th>
                </tr>
                </thead>
                <tbody className="bg-gray-900">
                {loglist.map(log => (
                    <tr key={log.hash} className="hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-4 py-2 border-b border-gray-700 text-sm">{log.author_name}</td>
                    <td className="px-4 py-2 border-b border-gray-700 text-sm">{new Date(log.date).toLocaleString()}</td>
                    <td className="px-4 py-2 border-b border-gray-700 text-sm">{log.message}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
