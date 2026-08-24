import { daysBetween, formatDate } from './valueParsing.js'

export const DEFAULT_SETTINGS = {
  renewalWindowDays: 90,
  recentlyMovedWindowDays: 180
}

export const REASON_LABELS = {
  renewal_window: 'Renewal window',
  active_renewal_discussion: 'Active renewal discussion',
  active_upsell_pipeline: 'Active upsell pipeline',
  recently_moved: 'Recently moved',
  manual_override: 'Manual override'
}

// Evaluates the five lock rules for a single normalized account and returns
// every reason that applies (an account can be locked for more than one).
export function computeAccountLock(account, settings, today = new Date()) {
  const reasons = []

  if (account.renewalDate) {
    const diff = daysBetween(account.renewalDate, today) // + = future, - = past
    if (Math.abs(diff) <= settings.renewalWindowDays) {
      const when = diff === 0 ? 'today' : diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`
      reasons.push({
        type: 'renewal_window',
        label: REASON_LABELS.renewal_window,
        detail: `Renews ${formatDate(account.renewalDate)} (${when}, window ${settings.renewalWindowDays}d)`
      })
    }
  }

  if (account.activeRenewalDiscussion) {
    reasons.push({
      type: 'active_renewal_discussion',
      label: REASON_LABELS.active_renewal_discussion,
      detail: 'Flagged as an active renewal discussion'
    })
  }

  if (account.activeUpsellPipeline) {
    reasons.push({
      type: 'active_upsell_pipeline',
      label: REASON_LABELS.active_upsell_pipeline,
      detail: 'Flagged as active upsell pipeline'
    })
  }

  if (account.recentlyMovedDate) {
    const diff = daysBetween(today, account.recentlyMovedDate) // days since the move
    if (diff >= 0 && diff <= settings.recentlyMovedWindowDays) {
      reasons.push({
        type: 'recently_moved',
        label: REASON_LABELS.recently_moved,
        detail: `Moved ${formatDate(account.recentlyMovedDate)} (${diff}d ago, window ${settings.recentlyMovedWindowDays}d)`
      })
    }
  }

  if (account.manualOverride) {
    reasons.push({
      type: 'manual_override',
      label: REASON_LABELS.manual_override,
      detail: 'Manually flagged to stay put'
    })
  }

  return { locked: reasons.length > 0, reasons }
}
