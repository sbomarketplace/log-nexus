import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileContent: (content: string, filename: string) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileContent, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = React.useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isWordFile = file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx');

    if (!isTextFile && !isWordFile) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a .txt, .doc, or .docx file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      let content = '';

      if (isTextFile) {
        // Handle text files
        content = await file.text();
      } else if (isWordFile) {
        // Handle Word documents using mammoth (already installed)
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      }

      if (content.trim()) {
        setUploadedFile(file.name);
        onFileContent(content, file.name);
        toast({
          title: "File Uploaded Successfully",
          description: `Extracted text from ${file.name}`,
        });
      } else {
        toast({
          title: "No Content Found",
          description: "The uploaded file appears to be empty or contains no readable text.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process the uploaded file. Please try again.",
        variant: "destructive",
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    onFileContent('', '');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Upload File (Optional)</Label>
      
      {uploadedFile ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm flex-1">{uploadedFile}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.doc,.docx"
            onChange={handleFileUpload}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <span className="text-xs text-muted-foreground">
            Supports .txt, .doc, .docx files
          </span>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Upload incident notes from a text or Word document. The content will be parsed automatically.
      </p>
    </div>
  );
};

export default FileUploader;