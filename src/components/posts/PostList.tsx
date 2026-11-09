import { Fragment } from 'react';
import type { Post, Category } from '@/types/social';
import type { Placement } from '@/types/ads';
import { PostCard } from './PostCard';
import { AdSlot, interleave, useAdFrequency } from '@/components/ads/AdUnits';
import { useIsMobile } from '@/lib/hooks';

/** Lista de publicações com anúncios intercalados (no máximo 1 a cada N, mínimo 6). */
export function PostList({ posts, adCategories, adPlacement, adContext, withAds = true }: { posts: Post[]; adCategories: Category[]; adPlacement?: Placement; adContext?: string; withAds?: boolean }) {
  const isMobile = useIsMobile();
  const every = useAdFrequency();
  const placement: Placement = adPlacement ?? (isMobile ? 'mobile_feed' : 'feed');
  const rows = withAds ? interleave(posts, every) : posts.map((item) => ({ kind: 'item' as const, item }));
  return (
    <div className="space-y-3 sm:space-y-4">
      {rows.map((r, i) =>
        r.kind === 'item' ? (
          <PostCard key={r.item.id} post={r.item} />
        ) : (
          <Fragment key={`ad-${i}`}>
            <AdSlot placement={placement} categories={adCategories} seed={r.index} variant={isMobile ? 'mobile' : 'feed'} context={adContext} />
          </Fragment>
        ),
      )}
    </div>
  );
}
