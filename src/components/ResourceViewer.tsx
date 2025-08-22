import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X } from 'lucide-react';
import { exportHtmlToPdf } from '@/utils/exporters';

interface ResourceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  mdPath: string;
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({
  open,
  onOpenChange,
  title,
  mdPath
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !mdPath) return;

    const loadContent = async () => {
      setLoading(true);
      try {
        // Import the markdown file content
        const response = await fetch(`/src/content/resources/${mdPath}`);
        if (!response.ok) throw new Error('Failed to load content');
        const markdown = await response.text();
        
        // Simple markdown to HTML conversion for basic formatting
        const html = markdown
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^\*\*(.+?)\*\*$/gm, '<strong>$1</strong>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/^- \[ \] (.+)$/gm, '<label class="flex items-center gap-2 my-1"><input type="checkbox" disabled /> $1</label>')
          .replace(/^- \[x\] (.+)$/gm, '<label class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled /> $1</label>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted pl-4 italic my-4">$1</blockquote>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^(.+)$/gm, (match) => {
            // Don't wrap already processed HTML tags
            if (match.startsWith('<') || match.trim() === '') return match;
            return `<p>${match}</p>`;
          });

        // Wrap consecutive <li> tags in <ul>
        const htmlWithLists = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
          return `<ul class="list-disc list-inside space-y-1 my-4">${match}</ul>`;
        });

        setContent(htmlWithLists);
      } catch (error) {
        console.error('Failed to load resource content:', error);
        setContent('<p>Failed to load content. Please try again.</p>');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [open, mdPath]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !title) return;
    
    try {
      await exportHtmlToPdf(title, contentRef.current);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Focus the heading when opened
  useEffect(() => {
    if (open && contentRef.current) {
      const heading = contentRef.current.querySelector('h1');
      if (heading) {
        (heading as HTMLElement).focus();
      }
    }
  }, [open, content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] mx-1 my-4 flex flex-col p-0 resource-viewer-content rounded-lg" showClose={false}>
        <DialogHeader className="px-6 py-4 border-b resource-viewer-header flex-shrink-0">
          <div className="flex flex-col items-center gap-4">
            <DialogTitle className="text-xl font-semibold text-center">{title}</DialogTitle>
            <div className="flex items-center gap-2 resource-viewer-actions no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                aria-label="Download as PDF"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                aria-label="Print document"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                aria-label="Close viewer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 px-6 py-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading content...</div>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};