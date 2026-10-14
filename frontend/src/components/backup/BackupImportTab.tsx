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
      <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-white">Upload de Backup Externo (.dump, .dump.gz, .sql)</h3>
          <p className="text-xs text-slate-400 mt-1">
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
              ? 'border-pink-500 bg-pink-500/10 scale-[1.005]'
              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
          }`}
        >

          <input
            ref={fileInputRef}
            type="file"
            accept=".dump,.gz,.sql"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-xs font-semibold text-white">
            Arraste e solte o arquivo aqui ou clique para selecionar
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Formatos aceitos: .dump, .dump.gz, .sql (até 500 MB)
          </p>
        </div>

        {/* Arquivo selecionado */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 truncate">
              <FileText className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || loading}
              data-testid="btn-confirm-import"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
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
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Aviso de Segurança / Instruções */}
        <div className="flex items-start gap-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-[11px] text-slate-400 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-purple-300">Atenção:</strong> A importação de um backup salva o arquivo no Backblaze B2 e o disponibiliza na lista para download ou restauração. Ele não substitui o banco de dados atual automaticamente a menos que você solicite a <strong>Restauração</strong> na aba de Backups.
          </p>
        </div>
      </div>
    </div>
  );
};
