import React, { useRef, useState } from 'react';
import { Upload, FileAudio, FileText, X } from 'lucide-react';
import { UploadedFile } from '../types';

interface UploadZoneProps {
  onFilesSelected: (files: UploadedFile[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<UploadedFile[]>([]);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    const promises: Promise<void>[] = [];

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            newFiles.push({
              name: file.name,
              type: file.type,
              mimeType: file.type,
              data: e.target.result as string,
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      setUploadedItems((prev) => [...prev, ...newFiles]);
      onFilesSelected(newFiles);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const updated = [...uploadedItems];
    updated.splice(index, 1);
    setUploadedItems(updated);
    // Note: In a real app, we'd sync this removal back to parent state
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging ? 'border-vave-primary bg-vave-primary/5' : 'border-gray-300 hover:border-vave-light hover:bg-gray-50'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a"
          onChange={(e) => processFiles(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-vave-primary/10 rounded-full">
            <Upload className="w-6 h-6 text-vave-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              MP3, PDF, DOCX, PPT (Max 10MB)
            </p>
          </div>
        </div>
      </div>

      {uploadedItems.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedItems.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                {file.type.includes('audio') ? (
                  <FileAudio className="w-5 h-5 text-purple-500" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-500" />
                )}
                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadZone;