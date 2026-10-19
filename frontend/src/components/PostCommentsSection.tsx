import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, RefreshCw, Send, CornerDownRight, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { CommentItem, CommentsResponse } from '../types';

interface Props {
  postId: number;
  platform: 'instagram' | 'youtube' | string;
  externalPostId?: string | null;
}

export const PostCommentsSection: React.FC<Props> = ({ postId, platform }) => {
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isInstagram = platform === 'instagram';
  const isYouTube = platform === 'youtube';

  const loadComments = useCallback(async (clearFeedback: boolean = true) => {
    if (!postId || (!isInstagram && !isYouTube)) return;
    setIsLoading(true);
    if (clearFeedback) {
      setFeedback(null);
    }
    try {
      const res = await api.getPostComments(postId, platform);
      setData(res);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao carregar comentários.';
      setData({
        success: false,
        platform,
        detail,
        total_count: 0,
        comments: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [postId, platform, isInstagram, isYouTube]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSendReply = async (commentId?: string) => {
    const textToSend = commentId ? replyText.trim() : newCommentText.trim();
    if (!textToSend) return;

    setIsSending(true);
    setFeedback(null);
    try {
      const res = await api.replyPostComment(postId, {
        platform,
        message: textToSend,
        comment_id: commentId
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: commentId ? 'Resposta publicada com sucesso!' : 'Comentário publicado com sucesso!'
        });
        if (commentId) {
          setReplyingToId(null);
          setReplyText('');
        } else {
          setNewCommentText('');
        }
        // Recarrega comentários após envio sem limpar o banner de sucesso
        await loadComments(false);
      } else {
        setFeedback({
          type: 'error',
          message: res.detail || 'Não foi possível publicar a resposta.'
        });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao enviar resposta.';
      setFeedback({ type: 'error', message: detail });
    } finally {
      setIsSending(false);
    }
  };

  const formatCommentDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      data-testid="post-comments-section"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs"
    >
      {/* Cabeçalho da Seção de Comentários */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isInstagram ? 'bg-pink-50 text-pink-600' : 'bg-red-50 text-red-600'}`}>
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Comentários & Respostas
            </h4>
            <p className="text-[11px] text-slate-500">
              Interaja diretamente no {isInstagram ? 'Instagram Reels' : 'YouTube Shorts'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.success && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
              {data.total_count} {data.total_count === 1 ? 'comentário' : 'comentários'}
            </span>
          )}

          <button
            type="button"
            onClick={() => loadComments(true)}
            disabled={isLoading}
            data-testid="btn-refresh-comments"
            title="Atualizar comentários"
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner de Feedback (Sucesso ou Erro) */}
      {feedback && (
        <div
          data-testid="comments-feedback-banner"
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Aviso de Permissão Ausente no Token */}
      {!isLoading && data && !data.success && data.detail && (
        <div
          data-testid="comments-permission-alert"
          className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-semibold">Configuração necessária no Token:</strong>
            <p className="text-amber-800 leading-relaxed">{data.detail}</p>
          </div>
        </div>
      )}

      {/* Campo para Adicionar Novo Comentário no Post */}
      {data?.success && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={`Escrever um comentário oficial no ${isInstagram ? 'Instagram' : 'YouTube'}...`}
            data-testid="input-new-comment"
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
          <button
            type="button"
            onClick={() => handleSendReply()}
            disabled={isSending || !newCommentText.trim()}
            data-testid="btn-send-new-comment"
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Publicar</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Lista de Comentários */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400" data-testid="comments-loading">
          <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
          <span className="text-xs">Carregando comentários em tempo real...</span>
        </div>
      ) : data?.success && data.comments.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1" data-testid="comments-list">
          {data.comments.map((comment: CommentItem) => (
            <div
              key={comment.id}
              data-testid={`comment-item-${comment.id}`}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              {/* Autor e Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-700 uppercase">
                    {comment.username.slice(0, 2)}
                  </div>
                  <span className="font-bold text-slate-900" data-testid="comment-author">
                    @{comment.username}
                  </span>
                  {comment.timestamp && (
                    <span className="text-[10px] text-slate-400">
                      {formatCommentDate(comment.timestamp)}
                    </span>
                  )}
                </div>

                {comment.like_count !== undefined && comment.like_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{comment.like_count}</span>
                  </span>
                )}
              </div>

              {/* Texto do Comentário */}
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-8" data-testid="comment-text">
                {comment.text}
              </p>

              {/* Ação de Responder */}
              <div className="pl-8 flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    setReplyText('');
                  }}
                  data-testid={`btn-reply-${comment.id}`}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 transition-colors"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>{replyingToId === comment.id ? 'Cancelar' : 'Responder'}</span>
                </button>
              </div>

              {/* Caixa de Resposta Inline */}
              {replyingToId === comment.id && (
                <div className="ml-8 mt-2 p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Responder a @${comment.username}...`}
                    data-testid={`input-reply-${comment.id}`}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(comment.id);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendReply(comment.id)}
                      disabled={isSending || !replyText.trim()}
                      data-testid={`btn-submit-reply-${comment.id}`}
                      className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs disabled:opacity-40"
                    >
                      <span>Enviar Resposta</span>
                      <Send className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Respostas Aninhadas (Replies) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-200 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-800">
                          @{reply.username}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatCommentDate(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : data?.success && data.comments.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs" data-testid="comments-empty">
          <MessageCircle className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
          <p className="font-medium text-slate-600">Nenhum comentário recebido ainda.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Quando seus seguidores comentarem no post, você poderá ler e responder por aqui.
          </p>
        </div>
      ) : null}
    </div>
  );
};
