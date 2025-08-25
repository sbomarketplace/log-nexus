import React, { useEffect, useState } from 'react';
import { getCredits, onCreditsChange, FREE_LIMIT } from '@/lib/credits';

export function AiCreditsPanel() {
  const [state, setState] = useState({ freeLeft: FREE_LIMIT, paid: 0, sub: false });
  
  useEffect(() => {
    let off = () => {};
    (async () => {
      const s = await getCredits();
      setState({ 
        freeLeft: Math.max(0, FREE_LIMIT - s.freeUsed), 
        paid: s.paidCredits, 
        sub: s.subActive 
      });
      off = onCreditsChange(ns => setState({ 
        freeLeft: Math.max(0, FREE_LIMIT - ns.freeUsed), 
        paid: ns.paidCredits, 
        sub: ns.subActive 
      }));
    })();
    return () => off();
  }, []);

  if (state.sub) {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-green-800">
        <div className="text-[17px] font-semibold">Unlimited plan active</div>
        <div className="text-sm text-green-600 mt-1">Unlimited AI reports</div>
      </div>
    );
  }

  const used = FREE_LIMIT - state.freeLeft;
  const pct = Math.min(100, Math.round((used / FREE_LIMIT) * 100));

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[17px] font-semibold">{state.freeLeft} free AI reports remaining</div>
        <div className="text-sm text-gray-500">Free: {FREE_LIMIT} per account</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-sm text-gray-600">Used {used}/{FREE_LIMIT}</div>
      {state.paid > 0 && (
        <div className="mt-3 rounded-lg border p-3 text-sm">
          <div className="font-medium">Purchased credits</div>
          <div className="text-gray-600">{state.paid} remaining</div>
        </div>
      )}
    </div>
  );
}