import { CalloutType } from './Callout'

// Module augmentation to extend TipTap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    details: {
      /**
       * Set details (collapsible) block around selection
       */
      setDetails: () => ReturnType
      /**
       * Toggle details (collapsible) block
       */
      toggleDetails: () => ReturnType
    }
    callout: {
      /**
       * Set callout block with specified type
       */
      setCallout: (type: CalloutType) => ReturnType
      /**
       * Toggle callout block with specified type
       */
      toggleCallout: (type: CalloutType) => ReturnType
      /**
       * Remove callout block (lift content out)
       */
      unsetCallout: () => ReturnType
    }
    entryLink: {
      /**
       * Set entry link on selection or insert at cursor
       */
      setEntryLink: (entryId: string, entryTitle: string) => ReturnType
      /**
       * Remove entry link from selection
       */
      unsetEntryLink: () => ReturnType
    }
  }
}
