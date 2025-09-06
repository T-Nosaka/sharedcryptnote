
import React from 'react';
import './filelogmodal.css';
import { DefaultLogFields } from 'simple-git';

interface FileLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  loglist:ReadonlyArray<DefaultLogFields>
}

const FileLogModal: React.FC<FileLogModalProps> = ({ isOpen, onClose, fileName, loglist }) => {
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
                 保存日 {new Date(log.date).toLocaleDateString()}
              </p>

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileLogModal;
