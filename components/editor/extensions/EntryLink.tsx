'use client'

import { Mark, mergeAttributes, getMarkRange } from '@tiptap/core'
import Link from '@tiptap/extension-link'

// Entry link extension that extends TipTap's Link
// Allows linking to internal journal entries
export const EntryLink = Link.extend({
  name: 'entryLink',
  
  priority: 1001, // Higher than regular Link
  
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-entry-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-entry-id'),
        renderHTML: attributes => {
          if (!attributes['data-entry-id']) return {}
          return { 'data-entry-id': attributes['data-entry-id'] }
        },
      },
      'data-entry-title': {
        default: null,
        parseHTML: element => element.getAttribute('data-entry-title'),
        renderHTML: attributes => {
          if (!attributes['data-entry-title']) return {}
          return { 'data-entry-title': attributes['data-entry-title'] }
        },
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'a[data-entry-id]',
        priority: 51, // Higher than regular link
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'entry-link',
        style: 'color: #8B5CF6; text-decoration: underline; cursor: pointer;',
      }),
      0,
    ]
  },
  
  addCommands() {
    return {
      ...this.parent?.(),
      setEntryLink: (entryId: string, entryTitle: string) => ({ chain, state }) => {
        const { selection } = state
        const { empty } = selection
        
        // If selection is empty, insert the entry title as link text
        if (empty) {
          return chain()
            .insertContent({
              type: 'text',
              text: entryTitle,
              marks: [
                {
                  type: this.name,
                  attrs: {
                    href: `/entry/${entryId}`,
                    'data-entry-id': entryId,
                    'data-entry-title': entryTitle,
                  },
                },
              ],
            })
            .run()
        }
        
        // If there's a selection, wrap it with the entry link
        return chain()
          .setMark(this.name, {
            href: `/entry/${entryId}`,
            'data-entry-id': entryId,
            'data-entry-title': entryTitle,
          })
          .run()
      },
      unsetEntryLink: () => ({ chain }) => {
        return chain()
          .unsetMark(this.name, { extendEmptyMarkRange: true })
          .run()
      },
    }
  },
})
