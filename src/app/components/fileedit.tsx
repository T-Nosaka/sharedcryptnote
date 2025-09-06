'use client';

import React from 'react';

import { Repo } from '../models/gitinfo';

/*
 * ファイルリスト
 */
export function FileEditContents({
  loading,
  repo,
  editingFilePath,
  selectedFileContent,
  selectRepo,
  fileEncoding,
  password,
  setSelectedFileContent,
  handleSaveFile,
  handleCancelEdit,
}: {
  loading: boolean;
  repo: Repo | undefined;
  editingFilePath: string;
  selectedFileContent: string;
  selectRepo: string;
  fileEncoding: string;
  password: string;
  setSelectedFileContent: (value: string) => void;
  handleSaveFile: (gitinfostr: string,fileEncoding: string, editingFilePath : string, content : string, password: string) => void;
  handleCancelEdit: () => void;
})
 {
  return (
    <div className="mt-4 p-1 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">📕{repo?.name}</h2>                
        <span className="text-white">
            {editingFilePath}              
        </span>                

        <div className="mt-4 p-0 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
            <textarea
            className="w-full h-80 p-0 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            value={selectedFileContent}
            onChange={(e) => setSelectedFileContent(e.target.value)}
            placeholder="ファイルの内容を入力..."
            ></textarea>
            <button
            onClick={() => handleSaveFile(selectRepo,fileEncoding,editingFilePath,selectedFileContent,password)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
            {loading ? '保存中...' : '保存'}
            </button>
            <button
            onClick={handleCancelEdit}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
            キャンセル
            </button>
        </div>
    </div>
    );
}

