import { useState, useCallback, KeyboardEvent, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Keyboard } from "lucide-react";

interface HotkeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function HotkeyInput({ value, onChange, disabled }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      event.preventDefault();

      const modifiers = [];
      if (event.ctrlKey) modifiers.push("Ctrl");
      if (event.shiftKey) modifiers.push("Shift");
      if (event.altKey) modifiers.push("Alt");
      if (event.metaKey) modifiers.push("Command");

      const key = event.key.toUpperCase();
      if (!["CONTROL", "SHIFT", "ALT", "META"].includes(key)) {
        const hotkey = [...modifiers, key].join("+");
        onChange(hotkey);
        setIsRecording(false);
      }
    },
    [isRecording, onChange]
  );

  const startRecording = useCallback(() => {
    setIsRecording(true);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex gap-2 items-center">
      <Input
        ref={inputRef}
        value={value}
        readOnly
        placeholder={
          isRecording
            ? "Press shortcut key..."
            : "Click record button to set shortcut key"
        }
        onKeyDown={handleKeyDown}
        className={isRecording ? "border-blue-500 ring-2 ring-blue-500/20" : ""}
        disabled={disabled}
      />
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={startRecording}
        disabled={disabled}
      >
        <Keyboard className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
      </Button>
    </div>
  );
}
