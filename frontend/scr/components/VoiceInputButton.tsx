
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlternative;
}
interface SpeechEvent {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  onText: (text: string) => void;
  className?: string;
  "data-testid"?: string;
};

export default function VoiceInputButton({ onText, className, "data-testid": testId }: Props) {
  const { t, speechLang } = useI18n();
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    return () => recRef.current?.abort();
  }, [speechLang]);

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error(t("voice.unsupported"));
      return;
    }
    const rec = new Ctor();
    rec.lang = speechLang;
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
      }
      finalText = finalText.trim();
      if (finalText) onTextRef.current(finalText);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") toast.error(t("voice.denied"));
      else if (event.error === "no-speech") toast(t("voice.noSpeech"));
      else if (event.error === "network") toast.error(t("voice.network"));
      else if (event.error !== "aborted") toast.error(t("voice.error"));
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      toast.error(t("voice.error"));
    }
  }

  function toggle() {
    if (listening) recRef.current?.stop();
    else start();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
        listening
          ? "border-[#C2410C] bg-[#FEE2E2] text-[#991B1B]"
          : "border-[#E2E4DC] text-[#52656F] hover:border-[#237A62] hover:text-[#237A62]",
        className,
      )}
    >
      {listening ? <Square className="size-3.5 fill-current" /> : <Mic className="size-3.5" />}
      {listening ? t("voice.stop") : t("voice.start")}
      {listening && <span className="sr-only">{t("voice.listening")}</span>}
    </button>
  );
}
