import React, { useState } from 'react';

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onValueCommit: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * Numeric input that keeps a local text draft while the user is typing.
 *
 * A controlled `<input type="number">` bound directly to a numeric state will
 * rewrite an empty field to `0` on every keystroke, which makes it impossible
 * to clear a price and can silently commit a zero tariff. This component only
 * commits finite values within range and restores the last valid value on blur.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueCommit,
  min = 0,
  max,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [draft, setDraft] = useState<string>(() => String(value));
  const [isFocused, setIsFocused] = useState(false);
  const [lastExternalValue, setLastExternalValue] = useState(value);

  // Keep the draft in sync when a parent changes the value externally (preset
  // selection, reset to defaults) unless the user is actively editing. This is
  // a render-phase adjustment, not an effect, so no extra render is committed
  // with a stale draft.
  if (value !== lastExternalValue) {
    setLastExternalValue(value);
    if (!isFocused) {
      setDraft(String(value));
    }
  }

  const isWithinRange = (parsed: number): boolean => {
    if (!Number.isFinite(parsed)) return false;
    if (parsed < min) return false;
    if (max !== undefined && parsed > max) return false;
    return true;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);

    if (text.trim() === '') return;
    const parsed = Number(text);
    if (isWithinRange(parsed)) {
      onValueCommit(parsed);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    const parsed = Number(draft);
    if (draft.trim() === '' || !isWithinRange(parsed)) {
      setDraft(String(value));
    } else if (parsed !== value) {
      onValueCommit(parsed);
    }

    onBlur?.(event);
  };

  return (
    <input
      {...rest}
      type="number"
      min={min}
      max={max}
      value={draft}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};
