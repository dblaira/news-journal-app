import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  LIFE_DOMAINS,
  STANDARD_ONTOLOGY_VOCABULARY,
  STANDARD_AXIOM_STATUSES,
  STANDARD_RELATIONSHIP_TYPES,
} from '../types/ontology'
import { buildOntologyPromptSection } from '../lib/ontology/build-prompt-section'
import { buildAxiomReviewUpdate } from '../lib/ontology/axiom-review'

describe('standard ontology vocabulary', () => {
  it('keeps neutral product vocabulary separate from Adam example axioms', () => {
    assert.deepEqual(
      STANDARD_ONTOLOGY_VOCABULARY.parentDomains.map((domain) => domain.name),
      [...LIFE_DOMAINS]
    )

    assert.equal(STANDARD_ONTOLOGY_VOCABULARY.exampleAxioms.length, 0)
    assert.ok(STANDARD_ONTOLOGY_VOCABULARY.parentDomains.every((domain) => domain.childLabels.length > 0))
    assert.ok(STANDARD_RELATIONSHIP_TYPES.includes('predicts'))
    assert.ok(STANDARD_AXIOM_STATUSES.includes('candidate'))
  })
})

describe('ontology prompt section', () => {
  it('only injects confirmed non-demo axioms into model prompts', () => {
    const section = buildOntologyPromptSection([
      {
        antecedent: 'High Learning',
        consequent: 'Higher Affect',
        confidence: 0.67,
        status: 'confirmed',
        scope: 'personal',
      },
      {
        antecedent: 'Adam Exercise + Sleep',
        consequent: 'Adam stress recovery',
        confidence: 0.57,
        status: 'confirmed',
        scope: 'demo',
      },
      {
        antecedent: 'Unreviewed Sleep Pattern',
        consequent: 'Possible work change',
        confidence: 0.5,
        status: 'candidate',
        scope: 'personal',
      },
      {
        antecedent: 'Missing Metadata Pattern',
        consequent: 'Should not govern prompts',
        confidence: 0.9,
      },
      {
        antecedent: 'Starter Hypothesis Pattern',
        consequent: 'Should be tested before governing prompts',
        confidence: 0.8,
        status: 'confirmed',
        scope: 'starter_hypothesis',
      },
    ])

    assert.match(section, /High Learning/)
    assert.doesNotMatch(section, /Adam Exercise/)
    assert.doesNotMatch(section, /Unreviewed Sleep Pattern/)
    assert.doesNotMatch(section, /Missing Metadata Pattern/)
    assert.doesNotMatch(section, /Starter Hypothesis Pattern/)
  })
})

describe('axiom review transitions', () => {
  it('preserves confirmation timestamp when retiring a confirmed axiom', () => {
    const update = buildAxiomReviewUpdate(
      {
        status: 'confirmed',
        confirmed_at: '2026-05-01T12:00:00.000Z',
        rejected_at: null,
        retired_at: null,
      },
      'retired',
      '2026-05-02T12:00:00.000Z'
    )

    assert.deepEqual(update, {
      status: 'retired',
      confirmed_at: '2026-05-01T12:00:00.000Z',
      rejected_at: null,
      retired_at: '2026-05-02T12:00:00.000Z',
    })
  })

  it('rejects invalid direct transitions', () => {
    const update = buildAxiomReviewUpdate(
      {
        status: 'rejected',
        confirmed_at: null,
        rejected_at: '2026-05-01T12:00:00.000Z',
        retired_at: null,
      },
      'confirmed',
      '2026-05-02T12:00:00.000Z'
    )

    assert.deepEqual(update, { error: 'Cannot move axiom from rejected to confirmed' })
  })
})
