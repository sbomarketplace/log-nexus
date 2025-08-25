import * as React from "react";
import { X, Star } from "lucide-react";
import { openStoreReview, sendFeedbackEmail } from "@/lib/rateApp";
import FeedbackModal from "./FeedbackModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RateAppModal({ open, onClose }: Props) {
  const [rating, setRating] = React.useState<number>(0);
  const [hover, setHover] = React.useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState<boolean>(false);
  const stars = [1, 2, 3, 4, 5];

  React.useEffect(() => { 
    if (!open) { 
      setRating(0); 
      setHover(null); 
      setFeedbackOpen(false);
    } 
  }, [open]);
  if (!open) return null;

  async function onSubmit() {
    if (rating >= 4) {
      // Happy path → send to native store review page
      openStoreReview();
      onClose();
    } else {
      // Less than 4 stars → encourage private feedback instead of store review
      sendFeedbackEmail();
      onClose();
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* floating modal */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Enjoying ClearCase?</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-700">Please rate the app. Your feedback helps us improve.</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            {stars.map((n) => {
              const active = (hover ?? rating) >= n;
              return (
                <button
                  key={n}
                  aria-label={`${n} star`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star className={`h-8 w-8 ${active ? "fill-amber-400 stroke-amber-400" : "stroke-gray-400"}`} />
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={onSubmit}
              disabled={rating === 0}
              className={`rounded-xl px-4 py-2 text-sm text-white w-full ${rating === 0 ? "bg-gray-400" : "bg-blue-600 hover:opacity-90"}`}
            >
              {rating >= 4 ? "Rate on the App Store / Play" : "Send Feedback"}
            </button>
            <div className="flex gap-8 items-center justify-between">
              <button
                className="text-[15px] font-semibold text-blue-600"
                onClick={() => setFeedbackOpen(true)}
              >
                Give Feedback
              </button>
              <button className="text-[15px] text-gray-600" onClick={onClose}>
                Not now
              </button>
            </div>
          </div>

        </div>
      </div>

      {feedbackOpen && (
        <FeedbackModal
          rating={rating}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </div>
  );
}