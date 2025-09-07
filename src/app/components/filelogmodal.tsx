
import React from 'react';
import './filelogmodal.css';
import { DefaultLogFields } from 'simple-git';
import { CheckoutFileMode } from '@/hooks/handleGitCheckoutfile';

interface FileLogModalProps {
  selectRepo: string;
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  loglist:ReadonlyArray<DefaultLogFields>,
  handleGitCheckoutHashFile: (gitinfostr: string, mode: CheckoutFileMode, selectFilePath: string, hash?: string) => void
}

const FileLogModal: React.FC<FileLogModalProps> = ({ selectRepo,isOpen, onClose, fileName, loglist, handleGitCheckoutHashFile }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <p><span className="text-white">{fileName}</span></p>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <ul className="log-list">
          {loglist.map((log) => (
            <li key={log.hash} className="log-item">

              <p className="log-message">{log.message}</p>

              <p className="log-meta">
                <span className="log-meta">{log.author_name}</span>
              </p>

              <p className="log-meta">
                <span className="log-meta">{log.author_email}</span>
              </p>
              <p className="log-meta">
                <button
                className="px-1 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                onClick={() => {handleGitCheckoutHashFile( selectRepo, 'hash' , fileName, log.hash+"^");onClose();}}
                >
                    {new Date(log.date).toLocaleDateString()}に戻す
                </button>                
              </p>

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileLogModal;
