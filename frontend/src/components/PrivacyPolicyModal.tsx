import React, { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="privacy-policy-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Política de Privacidade</h2>
              <p className="text-xs text-slate-400">MultiPost — Em conformidade com a API do TikTok e LGPD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="btn-close-privacy-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem interna */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p className="text-slate-400 text-xs">Última atualização: Outubro de 2026</p>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">1. Informações que Coletamos</h3>
            <p>
              Ao conectar sua conta do TikTok ao <strong>MultiPost</strong> através da autorização oficial (OAuth 2.0),
              coletamos exclusivamente os dados estritamente necessários para viabilizar as postagens autorizadas por você:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Identificador da Conta:</strong> ID público (<code>open_id</code>) e nome de exibição básico (escopo <code>user.info.basic</code>).</li>
              <li><strong>Credenciais de Autorização:</strong> Chaves temporárias e criptografadas de autorização (<code>access_token</code> e <code>refresh_token</code>).</li>
            </ul>
            <p className="text-slate-400 text-xs">
              Nós <strong>NÃO</strong> temos acesso a senhas, mensagens privadas, contatos pessoais ou informações financeiras.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">2. Como Utilizamos as Informações</h3>
            <p>
              Os dados e tokens recebidos da API do TikTok são utilizados de forma única e exclusiva para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Identificar e autenticar a conta vinculada no painel;</li>
              <li>Realizar o upload binário e a publicação agendada dos vídeos enviados e aprovados por você (escopos <code>video.upload</code> e <code>video.publish</code>).</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">3. Não Compartilhamento e Privacidade</h3>
            <p>
              O <strong>MultiPost</strong> NÃO comercializa, NÃO repassa e NÃO compartilha dados de usuários do TikTok com corretores de dados, redes de anúncios ou quaisquer terceiros.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">4. Armazenamento e Segurança</h3>
            <p>
              Os tokens são protegidos por criptografia em banco de dados isolado. Os arquivos de vídeo permanecem no servidor apenas pelo tempo técnico indispensável para realizar a transmissão para as redes sociais.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">5. Revogação e Exclusão de Dados (Data Deletion)</h3>
            <p>
              Você pode revogar as permissões e solicitar a exclusão de todos os registros a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>No painel:</strong> Clicando em "Desconectar Conta" em Contas & Integrações, o que remove imediatamente os tokens armazenados;</li>
              <li><strong>No aplicativo do TikTok:</strong> Em Configurações e Privacidade &gt; Segurança &gt; Gerenciar permissões de apps &gt; MultiPost &gt; Remover acesso;</li>
              <li><strong>Por e-mail:</strong> Enviando uma mensagem para <code>suporte@multipost.com</code> para exclusão completa de qualquer dado em até 48 horas úteis.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
