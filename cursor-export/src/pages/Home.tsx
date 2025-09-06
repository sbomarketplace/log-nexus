import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHero from '@/components/PageHero';
import { cn } from '@/lib/utils';

const Home = () => {
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNotesTitle, setQuickNotesTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  
  const MAX_CHARS = 10000;

  return (
    <Layout>
      <div className="cc-page space-y-4">
        {/* Quick Incident Entry */}
        <div className="mb-4">
          <div className="mx-auto w-full max-w-xl">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
              <section aria-labelledby="quick-entry-title">
                <PageHero 
                  title="Quick Incident Entry" 
                  subtitle="Use ClearCase to document workplace incidents, protect your rights, and stay organized."
                  pad="pt-3"
                />
                <p id="quick-entry-guidance" className="text-xs text-muted-foreground mb-3">
                  Include Who, What, When, Where, Why, and How for best results.
                </p>

                {/* Title */}
                <div className="mb-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-title-input" className="text-xs font-medium text-foreground block">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{80 - quickNotesTitle.length} characters left</span>
                  </div>
                  <Input
                    id="quick-title-input"
                    type="text"
                    value={quickNotesTitle}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 80);
                      if (titleError) setTitleError('');
                      setQuickNotesTitle(value);
                    }}
                    onBlur={() => setQuickNotesTitle((prev) => prev.trim())}
                    required
                    maxLength={80}
                    placeholder="Short, clear title (max 80)"
                    className={cn("rounded-2xl shadow-sm border border-border", titleError ? "border-red-500 animate-shake" : "")}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={titleError ? "title-error" : undefined}
                  />
                  {titleError && <div id="title-error" className="mt-1 text-xs text-red-600">{titleError}</div>}
                </div>

                {/* Notes */}
                <div className="mb-2">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-notes-input" className="text-xs font-medium text-foreground block">Notes</label>
                    <span id="quick-notes-counter" role="status" aria-live="polite" 
                          className={`text-xs ${quickNotes.length >= MAX_CHARS ? 'text-destructive' : quickNotes.length >= 8000 ? 'text-primary' : 'text-muted-foreground'} ml-auto`}>
                      {quickNotes.length} / 10,000
                    </span>
                  </div>
                  <Textarea
                    id="quick-notes-input"
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Type or paste raw notes…"
                    className="rounded-2xl shadow-sm resize-none min-h-[225px] max-h-[375px] border border-border"
                    aria-describedby="quick-entry-guidance quick-notes-counter"
                  />
                </div>

                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => {/* organize logic */}} 
                      className="flex-1 min-w-[150px] h-11 rounded-xl"
                    >
                      Organize Quick Notes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 min-w-[150px] h-11 rounded-xl"
                    >
                      Log Manually
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">AI will structure your notes into a report.</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Incident List would go here */}
      </div>
    </Layout>
  );
};

export default Home;