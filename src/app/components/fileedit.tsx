'use client';

import React, { useState, useEffect } from 'react';

import { Repo } from '../models/gitinfo';

/*
 * ファイル編集
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
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setIsDirty(false);
    }, [editingFilePath]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSelectedFileContent(e.target.value);
        setIsDirty(true);
    };

    const onSave = () => {
        handleSaveFile(selectRepo,fileEncoding,editingFilePath,selectedFileContent,password);
        setIsDirty(false);
    }
    const onCancel = () => {
        if (isDirty) {
          if (!window.confirm(`編集を破棄しますか？`)) {
            return;
          }
        }
        handleCancelEdit();
    }

  return (
    <div className="mt-4 p-1 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
        <div className="modal-header">
          <p><span className="text-white">📕{repo?.name}</span></p>
        </div>

        <span className="text-white">
          {editingFilePath}
        </span>                

        <div className="mt-4 p-0 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>

        <div className="flex items-center justify-between w-full">
          {/* 左側：保存ボタン */}
          <div>
            <button
              onClick={onSave}
              disabled={loading || !isDirty}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...💾...' : '💾'}
            </button>
          </div>

          {/* 右側：閉じるボタン */}
          <div>
            <button className="modal-close-btn" onClick={() => onCancel()}>
              &times;
            </button>
          </div>
        </div>

            <textarea
            className="w-full h-80 p-0 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            value={selectedFileContent}
            onChange={handleContentChange}
            placeholder="ファイルの内容を入力..."
            ></textarea>
        </div>
    </div>
    );
}

