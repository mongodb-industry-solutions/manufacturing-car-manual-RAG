import { useState } from "react";

interface InfoWizardSection {
  heading: string;
  content: Array<{
    heading?: string;
    body?: string | string[];
    image?: {
      src: string;
      alt: string;
      width?: number;
    };
  }>;
}

interface UseInfoWizardProps {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  tooltipText?: string;
  iconGlyph?: string;
  sections?: InfoWizardSection[];
}

export function useInfoWizard({
  open,
  setOpen,
  tooltipText = "Learn more",
  iconGlyph = "Wizard",
  sections = [],
}: UseInfoWizardProps) {
  const [selected, setSelected] = useState(0);
  return {
    open,
    setOpen,
    tooltipText,
    iconGlyph,
    sections,
    selected,
    setSelected,
  };
}
