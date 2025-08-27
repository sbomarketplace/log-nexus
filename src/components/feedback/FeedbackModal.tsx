import React, { useState } from "react";
import { X } from "lucide-react";
import { sendFeedback } from "@/utils/feedback";
import { showSuccessToast, showErrorToast } from "@/lib/showToast";

type Props = {
  rating?: number;
  onClose: () => void;
};

export default function FeedbackModal({ rating, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const max = 1000;

  async function onSubmit() {
    if (message.trim().length < 5) return;
    setBusy(true);
    try {
      await sendFeedback({
        message: message.trim(),
        rating: rating ?? null,
        email: email.trim() || null,
        meta: {
          version: import.meta.env.VITE_APP_VERSION || "1.0.0",
          ua: navigator.userAgent,
          ts: new Date().toISOString(),
        },
      });
      showSuccessToast("Thanks for the feedback!");
      // Close modal after brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (e) {
      // Fallback: open a mail draft
      const subj = encodeURIComponent("ClearCase Feedback");
      const body = encodeURIComponent(`Rating: ${rating ?? "n/a"}\n\n${message}`);
      window.location.href = `mailto:SBOMarketplaceapp@gmail.com?subject=${subj}&body=${body}`;
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Give Feedback</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-sm text-gray-700">
            Tell us what's working—or what we can improve.
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={max}
            placeholder="Type your feedback…"
            className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="text-xs text-gray-500 self-end">{message.length}/{max}</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional)"
            className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="px-5 py-4 flex gap-3 items-center justify-end border-t">
          <button 
            onClick={onClose} 
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            disabled={busy || message.trim().length < 5}
            onClick={onSubmit}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}