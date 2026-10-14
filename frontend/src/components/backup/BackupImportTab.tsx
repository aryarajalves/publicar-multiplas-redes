import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { formatFileSize } from './types';

interface BackupImportTabProps {
  onImportFile: (file: File) => Promise<void>;
  loading: boolean;
}

export const BackupImportTab: React.FC<BackupImportTabProps> = ({ onImportFile, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    const validExts = ['.dump', '.gz', '.sql'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExts.some(ext => lowerName.endsWith(ext));
    if (!isValid) {
      setErrorMessage('Formato não suportado. Por favor envie arquivos .dump, .dump.gz ou .sql.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('O arquivo excede o limite máximo permitido de 500 MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setErrorMessage(null);
      await onImportFile(selectedFile);
      setSuccessMessage(`Arquivo "${selectedFile.name}" importado e sincronizado com sucesso!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Falha ao processar e importar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upload de Backup Externo (.dump, .dump.gz, .sql)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Importe arquivos de dump criados manualmente ou em outro servidor diretamente para a nuvem Backblaze B2.
          </p>
        </div>

        {/* Dropzone em Largura Total */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-10 md:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#ea384c] bg-rose-50/50 scale-[1.005]'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dump,.gz,.sql"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#ea384c] flex items-center justify-center mx-auto mb-3 border border-rose-200">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-xs font-bold text-slate-800">
            Arraste e solte o arquivo aqui ou clique para selecionar
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos aceitos: .dump, .dump.gz, .sql (até 500 MB)
          </p>
        </div>

        {/* Arquivo selecionado */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3 truncate">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || loading}
              data-testid="btn-confirm-import"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#ea384c] hover:bg-[#d82a3e] text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Importar e Sincronizar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Mensagens de Sucesso / Erro */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
