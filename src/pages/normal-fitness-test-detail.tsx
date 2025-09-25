// Copy of fitness-test-detail with writes routed to normalFitnessTestResults
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import NormalTestProgressService from '../services/normalTestProgressService';
import Card from '../components/Card';

const TEST_UNITS: Record<string, string> = {
    test1: 'cm',
    test2: 'kg',
    test3: 'cm',
    test4: 'cm',
    test5: 'cm',
    test6: 'm',
    test7: 'sec',
    test8: 'sec',
    test9: 'count',
    test10: 'sec',
};

export default function NormalFitnessTestDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    function getNormalUserId(): string {
        const key = 'normalUserId';
        let id = localStorage.getItem(key);
        if (!id) {
            id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem(key, id);
        }
        return id;
    }
    const [saving, setSaving] = useState(false);
    const [recording, setRecording] = useState(false);
    const recordTimerRef = useRef<number | null>(null);
    const recordingStartRef = useRef<number | null>(null);
    // Keep only setter to avoid unused state variable
    const [, setElapsedSec] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [showViolation, setShowViolation] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [personCount, setPersonCount] = useState<number>(0);
    const [estimatedHeightCm, setEstimatedHeightCm] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cocoModelRef = useRef<any>(null);
    const poseModelRef = useRef<any>(null);
    const [pxPerCm] = useState<number | null>(null);
    const [jumpBaselineY, setJumpBaselineY] = useState<number | null>(null);
    const [jumpPeakY, setJumpPeakY] = useState<number | null>(null);
    const [jumpResultCm, setJumpResultCm] = useState<number | null>(null);
    const baselineFramesRef = useRef<number>(0);
    const [broadBaseline, setBroadBaseline] = useState<{x:number;y:number}|null>(null);
    const [broadMaxPoint, setBroadMaxPoint] = useState<{x:number;y:number}|null>(null);
    const [broadResultCm, setBroadResultCm] = useState<number | null>(null);
    const broadBaselineFramesRef = useRef<number>(0);
    const motionPrevRef = useRef<ImageData | null>(null);
    const [ballStartX, setBallStartX] = useState<number | null>(null);
    const [ballMaxDxPx, setBallMaxDxPx] = useState<number>(0);
    const [ballResultCm, setBallResultCm] = useState<number | null>(null);
    const [t7StartMs, setT7StartMs] = useState<number | null>(null);
    const [t7FinishMs, setT7FinishMs] = useState<number | null>(null);
    const [t7Secs, setT7Secs] = useState<number | null>(null);
    const [t8StartMs, setT8StartMs] = useState<number | null>(null);
    const [t8FinishMs, setT8FinishMs] = useState<number | null>(null);
    const [t8Secs, setT8Secs] = useState<number | null>(null);
    const t8CrossCountRef = useRef<number>(0);
    let t8PrevSide: 'left' | 'right' | null = null;
    const [t9Reps, setT9Reps] = useState<number>(0);
    const t9InCrunchRef = useRef<boolean>(false);
    const [t10Laps, setT10Laps] = useState<number>(0);
    const [t10StartMs, setT10StartMs] = useState<number | null>(null);
    const [t10Secs, setT10Secs] = useState<number | null>(null);
    const unit = TEST_UNITS[id || 'test1'] || '';

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (recordTimerRef.current) {
                window.clearInterval(recordTimerRef.current);
                recordTimerRef.current = null;
            }
        };
    }, []);

    async function startCamera() {
        try {
            const useRearCam = id === 'test3' || id === 'test4' || id === 'test5';
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: useRearCam ? 'environment' : 'user' }, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await new Promise<void>((resolve) => {
                    const v = videoRef.current!;
                    if (v.readyState >= 2) resolve();
                    else {
                        v.onloadedmetadata = () => resolve();
                        v.oncanplay = () => resolve();
                    }
                });
                await videoRef.current.play();
            }
            if (id === 'test1' || id === 'test3' || id === 'test4' || id === 'test5' || id === 'test6' || id === 'test7' || id === 'test8' || id === 'test9' || id === 'test10') {
                if (!cocoModelRef.current) {
                    const cocoSsd = await import('@tensorflow-models/coco-ssd');
                    const tf = await import('@tensorflow/tfjs');
                    await tf.setBackend('webgl');
                    await tf.ready();
                    cocoModelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                }
            }
            if (id === 'test3' || id === 'test4' || id === 'test5' || id === 'test8' || id === 'test9' || id === 'test10') {
                if (!poseModelRef.current) {
                    const tf = await import('@tensorflow/tfjs');
                    await tf.setBackend('webgl');
                    await tf.ready();
                    const poseDetection = await import('@tensorflow-models/pose-detection');
                    poseModelRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                        modelType: 'SinglePose.Lightning'
                    } as any);
                }
            }
            if (id === 'test1' || id === 'test3' || id === 'test4' || id === 'test5' || id === 'test6' || id === 'test7' || id === 'test8' || id === 'test9' || id === 'test10') requestAnimationFrame(analyzeFrame);
        } catch (e: any) {
            setError(e?.message || 'Unable to access camera');
        }
    }

    function estimateHeightFromBox(boxH: number, frameH: number): number | null {
        if (!boxH || !frameH) return null;
        if (pxPerCm && pxPerCm > 0) {
            const cm = boxH / pxPerCm;
            if (cm < 50 || cm > 250) return null;
            return Math.round(cm);
        }
        const ratio = boxH / frameH;
        const cm = (ratio / 0.8) * 170;
        if (cm < 50 || cm > 250) return null;
        return Math.round(cm);
    }

    function averagePoints(a?: {x:number;y:number;score?:number}, b?: {x:number;y:number;score?:number}) {
        const minScore = 0.3;
        const aOk = a && (a.score === undefined || a.score >= minScore);
        const bOk = b && (b.score === undefined || b.score >= minScore);
        if (aOk && bOk) return { x: (a!.x + b!.x)/2, y: (a!.y + b!.y)/2 } as any;
        if (aOk) return { x: a!.x, y: a!.y } as any;
        if (bOk) return { x: b!.x, y: b!.y } as any;
        return null as any;
    }

    function angleBetween(a: {x:number;y:number}, b: {x:number;y:number}, c: {x:number;y:number}) {
        const v1x = a.x - b.x, v1y = a.y - b.y;
        const v2x = c.x - b.x, v2y = c.y - b.y;
        const dot = v1x*v2x + v1y*v2y;
        const m1 = Math.hypot(v1x, v1y);
        const m2 = Math.hypot(v2x, v2y);
        if (!m1 || !m2) return 180;
        const cos = Math.max(-1, Math.min(1, dot / (m1*m2)));
        return (Math.acos(cos) * 180) / Math.PI;
    }

    function triggerViolation() {
        try { if (recorderRef.current && recording) { recorderRef.current.stop(); } } catch {}
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        setRecording(false);
        setShowViolation(true);
    }

    // Calibration removed in normal test detail to simplify quick tests

    async function analyzeFrame() {
        if (!videoRef.current) return;
        const video = videoRef.current;
        if (showViolation) return;
        try {
            if (!video.videoWidth || !video.videoHeight) return;
            if (id === 'test1' && cocoModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.strokeStyle = 'lime';
                        ctx.lineWidth = 2;
                        persons.forEach((p: any) => {
                            const [x, y, w, h] = p.bbox as [number, number, number, number];
                            ctx.strokeRect(x, y, w, h);
                            const est = estimateHeightFromBox(h, video.videoHeight);
                            if (est) setEstimatedHeightCm(est);
                        });
                    }
                }
            }
            else if (id === 'test3' && cocoModelRef.current && poseModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                let poses: any[] = [];
                try { poses = await poseModelRef.current.estimatePoses(video); } catch {}
                const pose = poses?.[0];
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (persons[0]) {
                            const [x, y, w, h] = persons[0].bbox as [number, number, number, number];
                            ctx.strokeStyle = 'lime';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, w, h);
                        }
                        if (pose?.keypoints) {
                            ctx.fillStyle = 'cyan';
                            ctx.strokeStyle = 'cyan';
                            ctx.lineWidth = 2;
                            const kp = pose.keypoints as Array<{ name?: string; x: number; y: number; score?: number }>;
                            kp.forEach((k) => {
                                const sc = (k as any).score;
                                if (sc === undefined || sc > 0.3) {
                                    ctx.beginPath();
                                    ctx.arc(k.x, k.y, 3, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            });
                            const leftWrist = kp.find(k => k.name === 'left_wrist');
                            const rightWrist = kp.find(k => k.name === 'right_wrist');
                            const leftToe = kp.find(k => k.name === 'left_foot_index');
                            const rightToe = kp.find(k => k.name === 'right_foot_index');
                            const leftAnkle = kp.find(k => k.name === 'left_ankle');
                            const rightAnkle = kp.find(k => k.name === 'right_ankle');
                            const wrist = averagePoints(leftWrist, rightWrist);
                            const feet = averagePoints(leftToe ?? leftAnkle, rightToe ?? rightAnkle);
                            if (wrist && feet) {
                                const dx = wrist.x - feet.x;
                                const dy = wrist.y - feet.y;
                                const distPx = Math.sqrt(dx*dx + dy*dy);
                                let cm: number | null = null;
                                if (pxPerCm && pxPerCm > 0) cm = Math.round((distPx / pxPerCm) * 10) / 10;
                                setEstimatedHeightCm(cm ?? null as any);
                                ctx.strokeStyle = 'lime';
                                ctx.beginPath();
                                ctx.moveTo(wrist.x, wrist.y);
                                ctx.lineTo(feet.x, feet.y);
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
            else if (id === 'test4' && cocoModelRef.current && poseModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                let poses: any[] = [];
                try { poses = await poseModelRef.current.estimatePoses(video); } catch {}
                const pose = poses?.[0];
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (persons[0]) {
                            const [x, y, w, h] = persons[0].bbox as [number, number, number, number];
                            ctx.strokeStyle = 'lime';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, w, h);
                        }
                        if (pose?.keypoints) {
                            ctx.fillStyle = 'cyan';
                            ctx.strokeStyle = 'cyan';
                            ctx.lineWidth = 2;
                            const kp = pose.keypoints as Array<{ name?: string; x: number; y: number; score?: number }>;
                            kp.forEach((k) => {
                                const sc = (k as any).score;
                                if (sc === undefined || sc > 0.3) {
                                    ctx.beginPath();
                                    ctx.arc(k.x, k.y, 3, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            });
                            const leftHip = kp.find(k => k.name === 'left_hip');
                            const rightHip = kp.find(k => k.name === 'right_hip');
                            const leftAnkle = kp.find(k => k.name === 'left_ankle');
                            const rightAnkle = kp.find(k => k.name === 'right_ankle');
                            const hip = averagePoints(leftHip, rightHip);
                            const ankle = averagePoints(leftAnkle, rightAnkle);
                            const refPoint = hip ?? ankle;
                            if (refPoint) {
                                if (recording && baselineFramesRef.current > 0) {
                                    setJumpBaselineY(prev => prev == null ? refPoint.y : (prev * 0.9 + refPoint.y * 0.1));
                                    baselineFramesRef.current -= 1;
                                }
                                setJumpPeakY(prev => prev == null ? refPoint.y : Math.min(prev, refPoint.y));
                                if (jumpBaselineY != null && jumpPeakY != null && jumpPeakY < jumpBaselineY) {
                                    const px = jumpBaselineY - jumpPeakY;
                                    if (pxPerCm && pxPerCm > 0) {
                                        const cm = Math.round((px / pxPerCm) * 10) / 10;
                                        setJumpResultCm(cm);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (id === 'test5' && cocoModelRef.current && poseModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                let poses: any[] = [];
                try { poses = await poseModelRef.current.estimatePoses(video); } catch {}
                const pose = poses?.[0];
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (persons[0]) {
                            const [x, y, w, h] = persons[0].bbox as [number, number, number, number];
                            ctx.strokeStyle = 'lime';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, w, h);
                        }
                        if (pose?.keypoints) {
                            ctx.fillStyle = 'cyan';
                            ctx.strokeStyle = 'cyan';
                            ctx.lineWidth = 2;
                            const kp = pose.keypoints as Array<{ name?: string; x: number; y: number; score?: number }>;
                            kp.forEach((k) => {
                                const sc = (k as any).score;
                                if (sc === undefined || sc > 0.3) {
                                    ctx.beginPath();
                                    ctx.arc(k.x, k.y, 3, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            });
                            const leftToe = kp.find(k => k.name === 'left_foot_index');
                            const rightToe = kp.find(k => k.name === 'right_foot_index');
                            const feetFront = averagePoints(leftToe, rightToe);
                            if (recording && feetFront) {
                                if (broadBaselineFramesRef.current > 0) {
                                    setBroadBaseline(prev => prev == null ? feetFront : { x: prev.x * 0.9 + feetFront.x * 0.1, y: prev.y * 0.9 + feetFront.y * 0.1 });
                                    broadBaselineFramesRef.current -= 1;
                                }
                                if (broadBaseline) {
                                    const dx = (feetFront.x - broadBaseline.x);
                                    const absDx = Math.abs(dx);
                                    if (!broadMaxPoint || absDx > Math.abs(broadMaxPoint.x - broadBaseline.x)) {
                                        setBroadMaxPoint(feetFront);
                                        if (pxPerCm && pxPerCm > 0) {
                                            const cm = Math.round((absDx / pxPerCm) * 10) / 10;
                                            setBroadResultCm(cm);
                                        }
                                    }
                                    ctx.strokeStyle = 'lime';
                                    ctx.beginPath();
                                    ctx.moveTo(broadBaseline.x, broadBaseline.y);
                                    ctx.lineTo(feetFront.x, feetFront.y);
                                    ctx.stroke();
                                }
                            }
                        }
                    }
                }
            }
            else if (id === 'test6') {
                if (cocoModelRef.current) {
                    const preds = await cocoModelRef.current.detect(video);
                    const persons = preds.filter((p: any) => p.class === 'person' && p.score > 0.5);
                    setPersonCount(persons.length);
                    if (persons.length > 1) { triggerViolation(); return; }
                }
                const w = video.videoWidth, h = video.videoHeight;
                const off = document.createElement('canvas');
                off.width = w; off.height = h;
                const octx = off.getContext('2d');
                if (octx) {
                    octx.drawImage(video, 0, 0, w, h);
                    const frame = octx.getImageData(0, 0, w, h);
                    const prev = motionPrevRef.current;
                    motionPrevRef.current = frame;
                    if (prev && canvasRef.current) {
                        let sumX = 0, sumY = 0, count = 0;
                        const data = frame.data, pdata = prev.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const dr = Math.abs(data[i] - pdata[i]);
                            const dg = Math.abs(data[i+1] - pdata[i+1]);
                            const db = Math.abs(data[i+2] - pdata[i+2]);
                            const diff = dr + dg + db;
                            if (diff > 60) {
                                const idx = i / 4;
                                const y = Math.floor(idx / w);
                                const x = idx - y * w;
                                sumX += x; sumY += y; count++;
                            }
                        }
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            canvasRef.current.width = w;
                            canvasRef.current.height = h;
                            ctx.clearRect(0,0,w,h);
                            if (count > 200) {
                                const cx = sumX / count;
                                const cy = sumY / count;
                                ctx.fillStyle = 'yellow';
                                ctx.beginPath();
                                ctx.arc(cx, cy, 6, 0, Math.PI*2);
                                ctx.fill();
                                if (ballStartX == null) setBallStartX(cx);
                                if (ballStartX != null) {
                                    const dx = Math.abs(cx - ballStartX);
                                    if (dx > ballMaxDxPx) {
                                        setBallMaxDxPx(dx);
                                        if (pxPerCm && pxPerCm > 0) setBallResultCm(Math.round((dx / pxPerCm) * 10) / 10);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (id === 'test7' && cocoModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const w = video.videoWidth, h = video.videoHeight;
                        canvasRef.current.width = w; canvasRef.current.height = h;
                        ctx.clearRect(0,0,w,h);
                        const xStart = w*0.2, xFinish = w*0.8;
                        ctx.strokeStyle = 'orange'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(xStart, 0); ctx.lineTo(xStart, h); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(xFinish, 0); ctx.lineTo(xFinish, h); ctx.stroke();
                        if (persons[0]) {
                            const [x, _y, pw, _ph] = persons[0].bbox as [number, number, number, number];
                            const cx = x + pw/2;
                            if (!t7StartMs && cx >= xStart) setT7StartMs(performance.now());
                            if (t7StartMs && !t7FinishMs && cx >= xFinish) {
                                const fin = performance.now();
                                setT7FinishMs(fin);
                                setT7Secs(Math.round(((fin - t7StartMs) / 1000) * 100) / 100);
                            }
                        }
                    }
                }
            }
            else if (id === 'test8' && cocoModelRef.current && poseModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const w = video.videoWidth, h = video.videoHeight;
                        canvasRef.current.width = w; canvasRef.current.height = h;
                        ctx.clearRect(0,0,w,h);
                        const leftX = w*0.3, rightX = w*0.7;
                        ctx.strokeStyle = 'orange'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(leftX, 0); ctx.lineTo(leftX, h); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(rightX, 0); ctx.lineTo(rightX, h); ctx.stroke();
                        if (persons[0]) {
                            const [x, _y, pw, _ph] = persons[0].bbox as [number, number, number, number];
                            const cx = x + pw/2;
                            const side: 'left' | 'right' = cx < (leftX + rightX)/2 ? 'left' : 'right';
                            if (!t8StartMs) t8PrevSide = side;
                            if (!t8StartMs && ((side === 'right' && cx >= rightX) || (side === 'left' && cx <= leftX))) {
                                setT8StartMs(performance.now());
                                t8CrossCountRef.current = 1;
                            }
                            if (t8StartMs && side !== t8PrevSide) {
                                t8PrevSide = side;
                                t8CrossCountRef.current += 1;
                                if (t8CrossCountRef.current >= 8 && !t8FinishMs) {
                                    const fin = performance.now();
                                    setT8FinishMs(fin);
                                    setT8Secs(Math.round(((fin - t8StartMs) / 1000) * 100) / 100);
                                }
                            }
                        }
                    }
                }
            }
            else if (id === 'test9' && poseModelRef.current) {
                if (cocoModelRef.current) {
                    const preds = await cocoModelRef.current.detect(video);
                    const persons = preds.filter((p: any) => p.class === 'person' && p.score > 0.5);
                    setPersonCount(persons.length);
                    if (persons.length > 1) { triggerViolation(); return; }
                }
                const poses = await poseModelRef.current.estimatePoses(video);
                const pose = poses?.[0];
                setPersonCount(poses?.length || 0);
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const w = video.videoWidth, h = video.videoHeight;
                        canvasRef.current.width = w; canvasRef.current.height = h;
                        ctx.clearRect(0,0,w,h);
                        if (pose?.keypoints) {
                            const kp = pose.keypoints as Array<{ name?: string; x: number; y: number; score?: number }>;
                            const leftShoulder = kp.find(k => k.name === 'left_shoulder');
                            const rightShoulder = kp.find(k => k.name === 'right_shoulder');
                            const leftHip = kp.find(k => k.name === 'left_hip');
                            const rightHip = kp.find(k => k.name === 'right_hip');
                            const leftKnee = kp.find(k => k.name === 'left_knee');
                            const rightKnee = kp.find(k => k.name === 'right_knee');
                            const shoulder = averagePoints(leftShoulder, rightShoulder);
                            const hip = averagePoints(leftHip, rightHip);
                            const knee = averagePoints(leftKnee, rightKnee);
                            if (shoulder && hip && knee) {
                                const angle = angleBetween(shoulder, hip, knee);
                                if (!t9InCrunchRef.current && angle < 60) t9InCrunchRef.current = true;
                                if (t9InCrunchRef.current && angle > 120) { t9InCrunchRef.current = false; setT9Reps(r => r + 1); }
                                ctx.strokeStyle = 'lime';
                                ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(shoulder.x, shoulder.y); ctx.stroke();
                                ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.stroke();
                                ctx.fillStyle = 'white'; ctx.fillText(`${Math.round(angle)}°`, hip.x + 8, hip.y - 8);
                            }
                        }
                    }
                }
            }
            else if (id === 'test10' && cocoModelRef.current && poseModelRef.current) {
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const w = video.videoWidth, h = video.videoHeight;
                        canvasRef.current.width = w; canvasRef.current.height = h;
                        ctx.clearRect(0,0,w,h);
                        const midX = w*0.5;
                        ctx.strokeStyle = 'orange'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();
                        if (persons[0]) {
                            const [x, _y, pw, _ph] = persons[0].bbox as [number, number, number, number];
                            const cx = x + pw/2;
                            if (!t10StartMs && cx >= midX) setT10StartMs(performance.now());
                            (analyzeFrame as any)._t10PrevSide = (analyzeFrame as any)._t10PrevSide || (cx < midX ? 'left' : 'right');
                            const prevSide = (analyzeFrame as any)._t10PrevSide;
                            const side: 'left'|'right' = cx < midX ? 'left' : 'right';
                            if (t10StartMs && side !== prevSide) {
                                (analyzeFrame as any)._t10PrevSide = side;
                                setT10Laps(l => l + 1);
                                setT10Secs(Math.round(((performance.now() - t10StartMs) / 1000) * 100) / 100);
                            }
                        }
                    }
                }
            }
        } catch {}
        if (streamRef.current && !recording) requestAnimationFrame(analyzeFrame);
    }

    function startRecording() {
        const stream = streamRef.current;
        if (!stream) { setError('Camera not started'); return; }
        setError(null);
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            await uploadBlob(blob);
        };
        recorderRef.current = recorder;
        recorder.start();
        setRecording(true);
        const start = Date.now();
        recordingStartRef.current = start;
        setElapsedSec(0);
        if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = window.setInterval(() => {
            const s = recordingStartRef.current || Date.now();
            const now = Date.now();
            setElapsedSec(Math.floor((now - s) / 1000));
        }, 1000) as unknown as number;
    }

    async function stopRecordingAndSubmit() {
        if (!recorderRef.current) return;
        recorderRef.current.stop();
        setRecording(false);
        if (recordTimerRef.current) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        recordingStartRef.current = null;
        setElapsedSec(0);
    }

    async function uploadBlob(blob: Blob) {
        if (!id) return;
        try {
            setSaving(true);
            const uid = user?.uid ?? getNormalUserId();
            const file = new File([blob], `${id}_${uid}_${Date.now()}.webm`, { type: 'video/webm' });
            const { supabase } = await import('../lib/supabase');
            const path = `${uid}/${file.name}`;
            const { error: upErr } = await supabase.storage.from('Fitness-Test').upload(path, file, { contentType: 'video/webm', upsert: false });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from('Fitness-Test').getPublicUrl(path);
            const videoUrl = data.publicUrl;
            const resultValue = id === 'test4' ? (jumpResultCm ?? null)
                : id === 'test5' ? (broadResultCm ?? null)
                : id === 'test6' ? (ballResultCm ?? null)
                : id === 'test7' ? (t7Secs ?? null)
                : id === 'test8' ? (t8Secs ?? null)
                : id === 'test9' ? (t9Reps as unknown as number | null)
                : id === 'test10' ? (t10Secs ?? null)
                : null;
            const integrity = id === 'test4' ? {
                personCount,
                pxPerCm: pxPerCm ?? null,
                calibrated: !!pxPerCm,
                baselineY: jumpBaselineY,
                peakY: jumpPeakY,
            } : id === 'test5' ? {
                personCount,
                pxPerCm: pxPerCm ?? null,
                calibrated: !!pxPerCm,
                takeoff: broadBaseline,
                landing: broadMaxPoint,
            } : id === 'test6' ? {
                pxPerCm: pxPerCm ?? null,
                calibrated: !!pxPerCm,
                startX: ballStartX,
                maxDxPx: ballMaxDxPx,
            } : id === 'test7' ? {
                startMs: t7StartMs,
                finishMs: t7FinishMs,
            } : id === 'test8' ? {
                startMs: t8StartMs,
                finishMs: t8FinishMs,
                crossings: t8CrossCountRef.current,
            } : id === 'test9' ? {
                reps: t9Reps,
            } : id === 'test10' ? {
                laps: t10Laps,
                startMs: t10StartMs,
            } : undefined;
            const payload: any = {
                testId: id,
                testName: id,
                result: resultValue,
                unit,
                testType: 'video',
                videoUrl,
            };
            if (integrity !== undefined) {
                payload.integrityResult = integrity;
            }
            await NormalTestProgressService.markTestAsCompleted(uid, id, payload);
            navigate('/normal-fitness-test');
        } catch (e: any) {
            setError(e?.message || 'Failed to upload');
        } finally {
            setSaving(false);
        }
    }

    if (id === 'test2') {
        return (
            <Card className="mx-auto max-w-lg" title="Submit Weight">
                <div className="space-y-3">
                    <label className="block">
                        <span className="block text-sm">Value ({unit})</span>
                        <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    </label>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="rounded border px-3 py-1.5">Cancel</button>
                        <button onClick={async () => {
                            if (!id || !user) return;
                            const num = Number(inputValue);
                            if (Number.isNaN(num)) { setError('Enter a valid number'); return; }
                            setSaving(true);
                            try {
                                await NormalTestProgressService.markTestAsCompleted(user.uid, id, {
                                    testId: id,
                                    testName: id,
                                    result: num,
                                    unit,
                                    testType: 'input',
                                });
                                navigate('/normal-fitness-test');
                            } finally { setSaving(false); }
                        }} disabled={saving} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Submit'}</button>
                    </div>
                </div>
                {showViolation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="w-full max-w-sm rounded bg-white p-4 text-gray-900">
                            <h4 className="text-base font-semibold">Test Violation</h4>
                            <p className="mt-2 text-sm">More than one person detected in frame. Please perform the test again alone.</p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={() => { setShowViolation(false); navigate('/normal-fitness-test'); }} className="rounded bg-black px-3 py-1.5 text-white">OK</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Removed quick info block inside test2 branch to satisfy TS control flow narrowing */}
            </Card>
        );
    }

    return (
        <Card className="mx-auto max-w-lg" title={id === 'test1' ? 'Capture Height (Anti-cheat enabled)' : (id === 'test3' ? 'Sit and Reach (Flexibility)' : 'Record Test')}>
            <div className="space-y-3">
                <div className="relative">
                    <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="rounded border px-3 py-1.5">Back</button>
                    <button onClick={startCamera} className="rounded border px-3 py-1.5">Start Camera</button>
                    {id === 'test1' ? (
                        <button onClick={async () => {
                            if (!videoRef.current) return;
                            if (personCount !== 1) { setError('Exactly one person must be in frame'); return; }
                            const v = videoRef.current;
                            const off = document.createElement('canvas');
                            off.width = v.videoWidth; off.height = v.videoHeight;
                            const ctx = off.getContext('2d');
                            if (!ctx) return;
                            ctx.drawImage(v, 0, 0, off.width, off.height);
                            off.toBlob(async (blob) => {
                                if (!blob) return;
                                try {
                                    setSaving(true);
                                    const uid = user?.uid ?? getNormalUserId();
                                    const file = new File([blob], `${id}_${uid}_${Date.now()}.png`, { type: 'image/png' });
                                    const { supabase } = await import('../lib/supabase');
                                    const path = `${uid}/${file.name}`;
                                    const { error: upErr } = await supabase.storage.from('Fitness-Test').upload(path, file, { contentType: 'image/png', upsert: false });
                                    if (upErr) throw upErr;
                                    const { data } = supabase.storage.from('Fitness-Test').getPublicUrl(path);
                                    const imageUrl = data.publicUrl;
                                    await NormalTestProgressService.markTestAsCompleted(uid, id, {
                                        testId: id,
                                        testName: id,
                                        result: estimatedHeightCm ?? null,
                                        unit,
                                        testType: 'input',
                                        imageUrl,
                                        integrityResult: {
                                            personCount,
                                            pxPerCm: pxPerCm ?? null,
                                            calibrated: !!pxPerCm,
                                        }
                                    });
                                    navigate('/normal-fitness-test');
                                } catch (e: any) { setError(e?.message || 'Failed to save'); }
                                finally { setSaving(false); }
                            }, 'image/png');
                        }} disabled={saving || personCount !== 1} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Capture & Save'}</button>
                    ) : (
                        <>
                            <button onClick={startRecording} disabled={recording} className="rounded border px-3 py-1.5">Start Recording</button>
                            <button onClick={stopRecordingAndSubmit} disabled={!recording || saving} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">{saving ? 'Uploading...' : 'Stop & Submit'}</button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}


