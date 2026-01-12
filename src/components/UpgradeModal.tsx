import React, { useState } from 'react';
import { Check, Zap, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Label } from './ui/Label';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export function UpgradeModal({ open, onOpenChange, onUpgrade }: UpgradeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideUpgradeModal', 'true');
    }
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    onUpgrade();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={handleClose}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            You've run out of credits. Upgrade to Pro for unlimited formatting.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-slate-700">
              <h3 className="font-semibold text-foreground mb-2">Free Plan</h3>
              <div className="text-2xl font-bold text-muted-foreground mb-3">$0</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>30 créditos por mês</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Basic formatting styles</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                  <span>Advanced features</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-foreground text-xs font-semibold rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Pro Plan</h3>
              <div className="text-2xl font-bold text-foreground mb-3">
                $9.99<span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-emerald-400">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Unlimited formatting</span>
                </li>
                <li className="flex items-start gap-2 text-emerald-400">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>All formatting styles</span>
                </li>
                <li className="flex items-start gap-2 text-emerald-400">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-emerald-400">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Advanced features</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <Label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this message again
            </Label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
            Subscribe to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
