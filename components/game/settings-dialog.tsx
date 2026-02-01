"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameSettings } from "./game-board";
import { cn } from "@/lib/utils";

export interface SettingsDialogProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-10 w-10"
        title="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
        <span className="sr-only">Settings</span>
      </Button>

      {/* Modal backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal content */}
          <div
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Gameplay Section */}
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                Gameplay
              </div>
              
              {/* Show target values toggle */}
              <SettingToggle
                label="Show Target Values"
                description="Reveal the dusk and dawn values before finding them"
                checked={settings.showTargetValues}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, showTargetValues: checked })
                }
              />

              {/* Highlight matches toggle */}
              <SettingToggle
                label="Highlight Matches"
                description="Highlight when current result matches a target"
                checked={settings.highlightMatches}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, highlightMatches: checked })
                }
              />

              {/* Auto-submit toggle */}
              <SettingToggle
                label="Auto-Submit"
                description="Automatically submit when all cards are placed"
                checked={settings.autoSubmit}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, autoSubmit: checked })
                }
              />

              {/* Sound effects toggle */}
              <SettingToggle
                label="Sound Effects"
                description="Play sounds for actions and milestones"
                checked={settings.soundEffects}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, soundEffects: checked })
                }
              />

              {/* Clear after submit toggle */}
              <SettingToggle
                label="Clear After Submit"
                description="Return all cards to hand after submitting"
                checked={settings.clearAfterSubmit}
                onChange={(checked) =>
                  onSettingsChange({ ...settings, clearAfterSubmit: checked })
                }
              />

              {/* Display Section */}
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mt-6 mb-2">
                Display
              </div>

              {/* Controls style */}
              <SettingOptionGroup
                label="Controls Style"
                description="How to display the action buttons"
                value={settings.controlsStyle}
                options={[
                  { value: "text-icons", label: "Text + Icons" },
                  { value: "icons-only", label: "Icons Only" },
                ]}
                onChange={(value) =>
                  onSettingsChange({ ...settings, controlsStyle: value as "text-icons" | "icons-only" })
                }
              />

              {/* History placement */}
              <SettingOptionGroup
                label="History Placement"
                description="Where to show submission history"
                value={settings.historyPlacement}
                options={[
                  { value: "inline", label: "Inline" },
                  { value: "drawer", label: "Side Drawer" },
                ]}
                onChange={(value) =>
                  onSettingsChange({ ...settings, historyPlacement: value as "inline" | "drawer" })
                }
              />

              {/* Card scaling */}
              <SettingOptionGroup
                label="Many Cards (8+)"
                description="How to handle many cards in hand"
                value={settings.cardScaling}
                options={[
                  { value: "scale", label: "Scale Down" },
                  { value: "scroll", label: "Horizontal Scroll" },
                ]}
                onChange={(value) =>
                  onSettingsChange({ ...settings, cardScaling: value as "scale" | "scroll" })
                }
              />

              {/* Max history length */}
              <SettingSelect
                label="History Length"
                description="Maximum number of submissions to show"
                value={settings.maxHistoryLength}
                options={[5, 10, 15, 20]}
                onChange={(value) =>
                  onSettingsChange({ ...settings, maxHistoryLength: value })
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

interface SettingSelectProps {
  label: string;
  description: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
}

function SettingSelect({ label, description, value, options, onChange }: SettingSelectProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-9 px-3 rounded-md border border-input bg-background text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SettingOptionGroupProps {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SettingOptionGroup({ label, description, value, options, onChange }: SettingOptionGroupProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              value === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
