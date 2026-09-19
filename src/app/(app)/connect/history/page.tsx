import { QuestionHistoryPage } from './question-history-page'

/**
 * A shell — the list now comes from the same cache entry the Connect tab
 * already filled, so arriving here from Connect paints immediately. See
 * `question-history-page.tsx`.
 */
export default function ConnectHistoryPage() {
  return <QuestionHistoryPage />
}
