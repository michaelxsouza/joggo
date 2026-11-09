import { useNavigate } from 'react-router-dom';
import { BarChart3, Copy, Pause, Pencil, Play, Send, Square, Trash2 } from 'lucide-react';
import type { Campaign } from '@/types/ads';
import { ads, review, validateCampaign } from '@/services/adsService';
import { Button } from '@/components/ui/Button';
import { Menu, type MenuItem } from '@/components/ui/misc';
import { useToast } from '@/components/ui/Toast';
import { useUI } from '@/app/UIContext';

/** Ações disponíveis para o anunciante conforme o status da campanha. */
export function CampaignActions({ c, showReport = true }: { c: Campaign; showReport?: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const ui = useUI();

  const submit = () => {
    const errs = validateCampaign(c, true);
    if (Object.keys(errs).length) {
      toast.error('Complete os campos obrigatórios antes de enviar.');
      navigate(`/anunciar/${c.id}/editar`);
      return;
    }
    review.submit(c.id);
    toast.success('Campanha enviada para análise.');
  };

  const primary = (() => {
    switch (c.status) {
      case 'rascunho':
        return <Button size="sm" icon={<Send className="h-4 w-4" />} onClick={submit}>Enviar para análise</Button>;
      case 'rejeitada':
        return <Button size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/anunciar/${c.id}/editar`)}>Editar e reenviar</Button>;
      case 'aprovada':
      case 'pausada':
        return (
          <Button
            size="sm"
            icon={<Play className="h-4 w-4" />}
            onClick={() => {
              const r = ads.start(c.id);
              r.ok ? toast.success('Veiculação simulada iniciada.') : toast.error(r.error!);
            }}
          >
            {c.status === 'pausada' ? 'Retomar' : 'Iniciar simulação'}
          </Button>
        );
      case 'ativa':
        return (
          <Button
            size="sm"
            variant="secondary"
            icon={<Pause className="h-4 w-4" />}
            onClick={() => {
              ads.pause(c.id);
              toast.success('Campanha pausada.');
            }}
          >
            Pausar
          </Button>
        );
      default:
        return null;
    }
  })();

  const more: MenuItem[] = [];
  if (showReport) more.push({ label: 'Ver relatório', icon: <BarChart3 className="h-4 w-4" />, onSelect: () => navigate(`/anunciar/${c.id}`) });
  if (['rascunho', 'rejeitada', 'aprovada', 'em_analise', 'pausada'].includes(c.status))
    more.push({
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onSelect: () => navigate(`/anunciar/${c.id}/editar`),
    });
  more.push({
    label: 'Duplicar',
    icon: <Copy className="h-4 w-4" />,
    onSelect: () => {
      const id = ads.duplicate(c.id);
      toast.success('Campanha duplicada como rascunho.');
      if (id) navigate(`/anunciar/${id}/editar`);
    },
  });
  if (['ativa', 'pausada', 'aprovada'].includes(c.status))
    more.push({
      label: 'Encerrar campanha',
      icon: <Square className="h-4 w-4" />,
      danger: true,
      onSelect: () =>
        ui.confirm({
          title: 'Encerrar campanha?',
          message: 'A campanha deixará de ser exibida na simulação. Esta ação não pode ser desfeita.',
          confirmLabel: 'Encerrar',
          danger: true,
          onConfirm: () => {
            ads.end(c.id);
            toast.success('Campanha encerrada.');
          },
        }),
    });
  if (c.status === 'rascunho' || c.status === 'rejeitada')
    more.push({
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onSelect: () =>
        ui.confirm({
          title: 'Excluir campanha?',
          message: `“${c.name}” será removida.`,
          confirmLabel: 'Excluir',
          danger: true,
          onConfirm: () => {
            ads.remove(c.id);
            toast.success('Campanha excluída.');
            navigate('/anunciar');
          },
        }),
    });

  return (
    <div className="flex items-center gap-1.5">
      {primary}
      <Menu items={more} label={`Ações de ${c.name}`} />
    </div>
  );
}
