import { useState } from 'react';
import logoUrl from '@/assets/brand/joggo-logo.png';
import iconUrl from '@/assets/brand/joggo-icon.png';
import { cn } from '@/lib/utils';

/**
 * Logo da Joggo. Preserva a proporção original (≈3,36:1).
 * Para trocar o arquivo, substitua src/assets/brand/joggo-logo.png ou passe `src`.
 * Se a imagem falhar, exibe o nome em texto.
 */
export function Logo({ className, src = logoUrl, height = 32 }: { className?: string; src?: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src)
    return (
      <span className={cn('font-extrabold tracking-tight text-ink', className)} style={{ fontSize: height * 0.9, lineHeight: 1 }}>
        <span className="text-lime">J</span>oggo
      </span>
    );
  return (
    <img
      src={src}
      alt="Joggo"
      onError={() => setFailed(true)}
      className={cn('w-auto select-none', className)}
      style={{ height, aspectRatio: '430 / 128' }}
      draggable={false}
    />
  );
}

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return <img src={iconUrl} alt="" aria-hidden className={cn('select-none', className)} style={{ width: size, height: size }} draggable={false} />;
}
