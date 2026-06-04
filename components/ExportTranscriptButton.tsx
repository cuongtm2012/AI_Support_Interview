"use client";

import { useState } from "react";
import { useTranscriptStore } from "@/stores/transcript";
import { useSettingsStore } from "@/stores/settings";
import { formatLiveSessionExport } from "@/lib/export-transcript";
import { Button } from "@/components/ui/Button";
import { IconCopy } from "@/components/ui/Icons";

export function ExportTranscriptButton() {
  const history = useTranscriptStore((s) => s.questionHistory);
  const { sourceLanguage, targetLanguage, answerStyle } = useSettingsStore();
  const [copied, setCopied] = useState(false);

  if (history.length === 0) return null;

  const handleExport = async () => {
    const text = formatLiveSessionExport([...history].reverse(), {
      sourceLang: sourceLanguage,
      targetLang: targetLanguage,
      style: answerStyle,
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="secondary"
      icon={<IconCopy size={16} />}
      onClick={() => void handleExport()}
      className="!py-1.5 !text-xs"
    >
      {copied ? "Đã copy!" : "Export transcript"}
    </Button>
  );
}
