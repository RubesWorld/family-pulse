import type { InterestCard } from '@/types/database'
import { unwrapRows } from './errors'
import type { DbClient } from './types'

export const interestCardKeys = {
  all: ['interest-cards'] as const,
  family: (familyId: string) => ['interest-cards', 'family', familyId] as const,
  own: (userId: string) => ['interest-cards', 'user', userId] as const,
}

/**
 * Every family member's interest cards.
 *
 * No `user_id` filter, for the same reason as `fetchFamilyRecentPicks`: the
 * "Users can view family interest cards" policy scopes this to
 * `user_id IN (SELECT public.current_family_member_ids())`. A list of ids the
 * client chose is not what keeps another family's cards out.
 */
export async function fetchFamilyInterestCards(
  db: DbClient
): Promise<InterestCard[]> {
  const result = await db.from('interest_cards').select('*')

  return unwrapRows<InterestCard>(result)
}

/** The caller's own interest cards. */
export async function fetchOwnInterestCards(
  db: DbClient,
  userId: string
): Promise<InterestCard[]> {
  const result = await db
    .from('interest_cards')
    .select('*')
    .eq('user_id', userId)

  return unwrapRows<InterestCard>(result)
}

/** One card as the editor holds it, before it has an id. */
export interface InterestCardDraft {
  category: string
  description: string
  is_custom: boolean
  tags: string[]
}

/**
 * Replace the caller's interest cards with `cards`.
 *
 * The editor used to do this as `DELETE WHERE user_id = me` followed by a
 * separate `INSERT`, with no transaction around the pair. A failed insert —
 * a dropped request, a rejected `tags` value — left the user with **no**
 * interest cards at all, and the only remaining copy was React state in a
 * component that was about to render an error over it.
 *
 * Reordering to insert-then-delete does not work either: `interest_cards` has
 * `unique(user_id, category)`, so re-inserting a card the user kept collides
 * with the row still sitting there.
 *
 * What does work is upserting on that same unique key and then deleting only
 * the categories the user actually removed:
 *
 *   - the upsert is a single statement, so it either applies in full or not at
 *     all, and nothing is destroyed on the way in;
 *   - if the delete then fails, the worst case is that a card the user removed
 *     is still there. Nothing they wrote is lost, and the next read shows the
 *     true state.
 *
 * There is no ordering left in which a failure loses data.
 *
 * `removedCategories` is passed in rather than derived from a `NOT IN` filter
 * so the deletion names exactly the rows it means. Categories are free text —
 * a custom interest can contain a comma or a parenthesis — and hand-building a
 * PostgREST `not.in.(…)` list means hand-writing its quoting.
 */
export async function saveInterestCards(
  db: DbClient,
  userId: string,
  cards: InterestCardDraft[],
  removedCategories: string[]
): Promise<void> {
  if (cards.length > 0) {
    const { error } = await db.from('interest_cards').upsert(
      cards.map((card) => ({
        user_id: userId,
        category: card.category,
        is_custom: card.is_custom,
        description: card.description,
        tags: card.tags,
      })),
      { onConflict: 'user_id,category' }
    )

    if (error) throw error
  }

  if (removedCategories.length > 0) {
    const { error } = await db
      .from('interest_cards')
      .delete()
      .eq('user_id', userId)
      .in('category', removedCategories)

    if (error) throw error
  }
}
