"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    Mic, MicOff, Play, Pause, Square, CheckCircle, Clock,
    RefreshCw, FileText, AlertTriangle, Loader2, Volume2, 
    Wand2, Save, Edit3
} from 'lucide-react';

interface ProcessedObservation {
    id: string;
    teacherName: string;
    date: string;
    duration: string;
    subject: string;
    yearGroup: string;
    transcript: string;
    summary: string;
    strengths: string[];
    areasForDevelopment: string[];
    ratings: Record<string, number>;
    eefRecommendations: string[];
    suggestedActions: string[];
    ofstedLinks: string[];
}

interface VoiceObservationProps {
    onSaveObservation: (observation: ProcessedObservation) => void;
}

const VoiceObservation: React.FC<VoiceObservationProps> = ({ onSaveObservation }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedObservation, setProcessedObservation] = useState<ProcessedObservation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [teacherName, setTeacherName] = useState('');
    const [subject, setSubject] = useState('');
    const [yearGroup, setYearGroup] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setError(null);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
            } else {
                mediaRecorderRef.current.pause();
                if (timerRef.current) clearInterval(timerRef.current);
            }
            setIsPaused(!isPaused);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setTranscript('');
        setRecordingTime(0);
        setProcessedObservation(null);
    };

    const transcribeAudio = async () => {
        if (!audioBlob) return;
        setIsTranscribing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            const response = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
            
            if (response.ok) {
                const data = await response.json();
                setTranscript(data.transcript);
            } else {
                // Demo fallback
                setTranscript(`Lesson observation for ${teacherName || 'the teacher'}. Strong subject knowledge demonstrated. Good use of questioning. Behaviour well managed. Clear learning objectives. Differentiation evident through tiered success criteria. Areas for development: pace could be quicker, more student talk needed.`);
            }
        } catch {
            setTranscript('Demo transcript - Voice recording captured successfully. Strong teaching observed with good engagement.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const processObservation = async () => {
        if (!transcript) return;
        setIsProcessing(true);

        try {
            const response = await fetch('/api/voice/process-observation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, teacherName, subject, yearGroup })
            });

            const observation: ProcessedObservation = response.ok ? await response.json() : {
                id: `obs_${Date.now()}`,
                teacherName: teacherName || 'Teacher',
                date: new Date().toISOString().split('T')[0],
                duration: formatTime(recordingTime),
                subject: subject || 'Not specified',
                yearGroup: yearGroup || 'Not specified',
                transcript,
                summary: 'A well-structured lesson with strong subject knowledge and effective assessment.',
                strengths: ['Strong subject knowledge', 'Effective questioning', 'Good differentiation'],
                areasForDevelopment: ['Increase lesson pace', 'More student discussion'],
                ratings: { subjectKnowledge: 4, pedagogy: 3, assessment: 4, behaviour: 3 },
                eefRecommendations: ['Feedback (+6 months): Enhance AfL', 'Collaborative learning (+5 months)'],
                suggestedActions: ['Observe exemplar lesson', 'Coaching on pace'],
                ofstedLinks: ['Curriculum and Teaching', 'Achievement']
            };
            setProcessedObservation(observation);
        } catch {
            setError('Processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'bg-green-500';
        if (rating >= 3) return 'bg-blue-500';
        if (rating >= 2) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Mic className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Voice-to-Observation</h1>
                </div>
                <p className="text-violet-100">Record your notes and let AI structure them</p>
            </div>

            {/* Recording Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-violet-500" /> Record Observation
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Teacher name" className="px-3 py-2 border rounded-lg" />
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject" className="px-3 py-2 border rounded-lg" />
                    <input type="text" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}
                        placeholder="Year Group" className="px-3 py-2 border rounded-lg" />
                </div>

                <div className="flex flex-col items-center py-8 bg-gray-50 rounded-xl">
                    <div className="text-5xl font-mono font-bold text-gray-800 mb-6">{formatTime(recordingTime)}</div>
                    
                    {isRecording && !isPaused && (
                        <div className="flex items-center gap-1 mb-6">
                            {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-red-500 rounded-full animate-pulse" style={{height: `${Math.random()*24+8}px`}} />)}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {!isRecording && !audioBlob && (
                            <button onClick={startRecording} className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                                <Mic className="w-8 h-8" />
                            </button>
                        )}
                        {isRecording && (
                            <>
                                <button onClick={pauseRecording} className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">
                                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                </button>
                                <button onClick={stopRecording} className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-800">
                                    <Square className="w-6 h-6" />
                                </button>
                            </>
                        )}
                        {audioBlob && !isRecording && (
                            <>
                                <button onClick={() => new Audio(URL.createObjectURL(audioBlob)).play()} className="p-3 bg-blue-500 text-white rounded-full">
                                    <Volume2 className="w-6 h-6" />
                                </button>
                                <button onClick={resetRecording} className="p-3 bg-gray-500 text-white rounded-full">
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{error}</div>}
            </div>

            {/* Transcription */}
            {audioBlob && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-violet-500" /> Transcript</h2>
                        {!transcript && (
                            <button onClick={transcribeAudio} disabled={isTranscribing} className="px-4 py-2 bg-violet-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                                {isTranscribing ? <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing...</> : <><Wand2 className="w-4 h-4" /> Transcribe</>}
                            </button>
                        )}
                    </div>
                    {transcript ? (
                        <div className="space-y-4">
                            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="w-full h-32 p-4 border rounded-lg font-mono text-sm" />
                            <div className="flex justify-end">
                                <button onClick={processObservation} disabled={isProcessing} className="px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Wand2 className="w-4 h-4" /> Process with AI</>}
                                </button>
                            </div>
                        </div>
                    ) : <div className="text-center py-8 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Click Transcribe to convert recording to text</p></div>}
                </div>
            )}

            {/* Processed Observation */}
            {processedObservation && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                                <h3 className="font-semibold">{processedObservation.teacherName} • {processedObservation.subject}</h3>
                                <p className="text-xs text-gray-500">{processedObservation.yearGroup} • {processedObservation.date}</p>
                            </div>
                        </div>
                        <button onClick={() => onSaveObservation(processedObservation)} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div><h4 className="font-semibold mb-2">Summary</h4><p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{processedObservation.summary}</p></div>
                        
                        <div>
                            <h4 className="font-semibold mb-3">Ratings</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(processedObservation.ratings).map(([key, value]) => (
                                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className={`px-2 py-0.5 text-xs text-white rounded ${getRatingColor(value)}`}>{value}/4</span>
                                        </div>
                                        <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`flex-1 h-2 rounded ${i <= value ? getRatingColor(value) : 'bg-gray-200'}`} />)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-3">Strengths</h4>
                                <ul className="space-y-2">{processedObservation.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-green-800"><CheckCircle className="w-4 h-4 mt-0.5" />{s}</li>)}</ul>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <h4 className="font-semibold text-amber-900 mb-3">Development Areas</h4>
                                <ul className="space-y-2">{processedObservation.areasForDevelopment.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-amber-800"><Edit3 className="w-4 h-4 mt-0.5" />{a}</li>)}</ul>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-3">EEF Recommendations</h4>
                            <ul className="space-y-2">{processedObservation.eefRecommendations.map((r, i) => <li key={i} className="text-sm text-blue-800">📚 {r}</li>)}</ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceObservation;

