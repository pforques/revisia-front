'use client';

import { useState, useRef } from 'react';
import { documentsAPI } from '@/lib/api';
import { Button, Card, Typography, Alert } from '@/components/ui';

interface FileUploadProps {
    onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList) => {
        if (files.length === 0) return;

        const file = files[0];
        setIsUploading(true);
        setError('');

        try {
            await documentsAPI.upload(file);
            onUploadSuccess();
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de l\'upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <Card
                className={`relative border-2 border-dashed transition-all duration-200 ${dragActive
                    ? 'border-orange-500 bg-orange-soft'
                    : 'border-border hover:border-orange-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                padding="lg"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.txt"
                />

                <div className="space-y-6 text-center">
                    <div className="text-6xl text-muted-foreground">📄</div>

                    <div>
                        <Typography variant="h5" className="mb-2">
                            Glissez-déposez votre fichier ici
                        </Typography>
                        <Typography variant="body" color="muted">
                            ou cliquez pour sélectionner un fichier
                        </Typography>
                    </div>

                    <Button
                        type="button"
                        onClick={onButtonClick}
                        disabled={isUploading}
                        variant="outline"
                        size="lg"
                    >
                        {isUploading ? 'Upload en cours...' : 'Sélectionner un fichier'}
                    </Button>

                    <Typography variant="caption" color="muted">
                        PDF, DOC, DOCX, JPG, PNG, GIF, TXT (max 5MB)
                    </Typography>
                </div>
            </Card>

            {error && (
                <Alert variant="error" className="mt-4">
                    {error}
                </Alert>
            )}
        </div>
    );
}
