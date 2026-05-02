import type { OntologyAxiomStatus } from '@/types/ontology'

export interface ReviewableAxiomState {
  status: OntologyAxiomStatus
  confirmed_at: string | null
  rejected_at: string | null
  retired_at: string | null
}

export interface AxiomReviewUpdate {
  status: OntologyAxiomStatus
  confirmed_at: string | null
  rejected_at: string | null
  retired_at: string | null
}

export function buildAxiomReviewUpdate(
  current: ReviewableAxiomState,
  nextStatus: OntologyAxiomStatus,
  now: string
): AxiomReviewUpdate | { error: string } {
  if (current.status === 'candidate' && nextStatus === 'confirmed') {
    return { status: nextStatus, confirmed_at: current.confirmed_at ?? now, rejected_at: null, retired_at: null }
  }

  if (current.status === 'candidate' && nextStatus === 'rejected') {
    return { status: nextStatus, confirmed_at: current.confirmed_at, rejected_at: current.rejected_at ?? now, retired_at: null }
  }

  if (current.status === 'confirmed' && nextStatus === 'retired') {
    return { status: nextStatus, confirmed_at: current.confirmed_at, rejected_at: current.rejected_at, retired_at: current.retired_at ?? now }
  }

  return { error: `Cannot move axiom from ${current.status} to ${nextStatus}` }
}
