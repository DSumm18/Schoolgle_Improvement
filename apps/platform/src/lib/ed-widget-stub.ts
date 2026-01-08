// Stub module for @schoolgle/ed-widget when not available (marketing site only)
export const EdWidget = {
  init: () => {
    console.warn('[EdWidget] Ed widget not available in marketing build');
    return {
      destroy: () => {},
    };
  },
  destroy: () => {},
};

export default EdWidget;



