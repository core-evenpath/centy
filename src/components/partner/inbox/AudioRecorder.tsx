'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Pause, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
    disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'recorded';

export function AudioRecorder({ onRecordingComplete, onCancel, disabled }: AudioRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Format duration as mm:ss
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start timer
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    }, []);

    // Stop timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopTimer();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [stopTimer, audioUrl]);

    const startRecording = async () => {
        try {
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;
            audioChunksRef.current = [];

            // Try to use opus/webm for better quality and WhatsApp compatibility
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '';
                    }
                }
            }

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Collect data every 100ms

            setDuration(0);
            startTimer();
            setState('recording');

        } catch (err: any) {
            console.error('Failed to start recording:', err);
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access to record audio.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError('Failed to start recording. Please try again.');
            }
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.pause();
            stopTimer();
            setState('paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && state === 'paused') {
            mediaRecorderRef.current.resume();
            startTimer();
            setState('recording');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
            stopTimer();
            mediaRecorderRef.current.stop();
            setState('recorded');
        }
    };

    const deleteRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setDuration(0);
        audioChunksRef.current = [];
        setState('idle');
    };

    const sendRecording = () => {
        if (audioChunksRef.current.length > 0) {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            onRecordingComplete(audioBlob, duration);
            deleteRecording();
        }
    };

    const handleCancel = () => {
        if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
            mediaRecorderRef.current.stop();
        }
        deleteRecording();
        onCancel();
    };

    // Idle state - show mic button
    if (state === 'idle') {
        return (
            <div className="flex flex-col items-center gap-2">
                {error && (
                    <div className="text-xs text-red-600 text-center px-4">
                        {error}
                    </div>
                )}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={startRecording}
                                className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Record Voice Message</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    // Recording/Paused/Recorded states - show recorder UI
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-2xl border border-red-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Cancel button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
            >
                <X className="w-4 h-4" />
            </Button>

            {/* Recording indicator */}
            {state === 'recording' && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            {state === 'paused' && (
                <div className="w-2 h-2 rounded-full bg-orange-500" />
            )}

            {/* Duration */}
            <span className="font-mono text-sm text-gray-700 min-w-[48px]">
                {formatDuration(duration)}
            </span>

            {/* Waveform visualization (simple) */}
            {(state === 'recording' || state === 'paused') && (
                <div className="flex items-center gap-0.5 px-2">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-1 rounded-full bg-red-400 transition-all",
                                state === 'recording' ? "animate-pulse" : ""
                            )}
                            style={{
                                height: `${8 + Math.random() * 16}px`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Audio preview for recorded state */}
            {state === 'recorded' && audioUrl && (
                <audio
                    src={audioUrl}
                    controls
                    className="h-8 max-w-[160px]"
                />
            )}

            <div className="flex items-center gap-1 ml-auto">
                {/* Pause/Resume button */}
                {(state === 'recording' || state === 'paused') && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={state === 'recording' ? pauseRecording : resumeRecording}
                        className="h-8 w-8 text-gray-600 hover:bg-red-100 rounded-full"
                    >
                        {state === 'recording' ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </Button>
                )}

                {/* Stop button */}
                {(state === 'recording' || state === 'paused') && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={stopRecording}
                        className="h-8 w-8 text-gray-600 hover:bg-red-100 rounded-full"
                    >
                        <Square className="w-4 h-4" />
                    </Button>
                )}

                {/* Delete button (recorded state) */}
                {state === 'recorded' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={deleteRecording}
                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}

                {/* Send button (recorded state) */}
                {state === 'recorded' && (
                    <Button
                        size="icon"
                        onClick={sendRecording}
                        className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// Compact mic button that triggers recording mode
interface MicButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export function MicButton({ onClick, disabled }: MicButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={onClick}
                        className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Mic className="w-5 h-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Record Voice Message</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
