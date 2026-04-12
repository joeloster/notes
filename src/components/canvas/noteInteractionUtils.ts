const isHtmlElement = (target: EventTarget | null): target is HTMLElement => target instanceof HTMLElement;

export const isCheckboxInteractionTarget = (target: EventTarget | null) => {
  if (!isHtmlElement(target)) return false;

  if (target.closest('input[type="checkbox"]')) return true;

  const label = target.closest('label');
  return Boolean(label?.querySelector('input[type="checkbox"]'));
};

export const isNoteControlTarget = (target: EventTarget | null) => {
  if (!isHtmlElement(target)) return false;

  return Boolean(
    isCheckboxInteractionTarget(target)
    || target.closest('button')
    || target.closest('input')
    || target.closest('[role="button"]'),
  );
};

export const isContentEditableTarget = (target: EventTarget | null) => (
  isHtmlElement(target) && Boolean(target.closest('[contenteditable="true"]'))
);

export const isNoteEditorTarget = (target: EventTarget | null) => (
  isHtmlElement(target) && Boolean(target.closest('[data-note-editor-scroll="true"]'))
);

export const getWheelDeltaMultiplier = (deltaMode: number, pageSize: number) => {
  if (deltaMode === 1) return 16;
  if (deltaMode === 2) return pageSize;
  return 1;
};