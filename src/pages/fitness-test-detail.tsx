import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
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

export default function FitnessTestDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [recording, setRecording] = useState(false);
    const [completed, setCompleted] = useState(false);
    const recordTimerRef = useRef<number | null>(null);
    const recordingStartRef = useRef<number | null>(null);
    const [elapsedSec, setElapsedSec] = useState<number>(0);
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
    const [pxPerCm, setPxPerCm] = useState<number | null>(null);
    const [calibrating, setCalibrating] = useState<boolean>(false);
    const [coachMessage, setCoachMessage] = useState<string>('Be ready. Align yourself in the frame.');
	// Vertical jump state (test4)
	const [jumpBaselineY, setJumpBaselineY] = useState<number | null>(null);
	const [jumpPeakY, setJumpPeakY] = useState<number | null>(null);
	const [jumpResultCm, setJumpResultCm] = useState<number | null>(null);
	const baselineFramesRef = useRef<number>(0);
	// Broad jump state (test5)
	const [broadBaseline, setBroadBaseline] = useState<{x:number;y:number}|null>(null);
	const [broadMaxPoint, setBroadMaxPoint] = useState<{x:number;y:number}|null>(null);
	const [broadResultCm, setBroadResultCm] = useState<number | null>(null);
	const broadBaselineFramesRef = useRef<number>(0);
	// Medicine ball (test6) motion tracking
	const motionPrevRef = useRef<ImageData | null>(null);
	const [ballStartX, setBallStartX] = useState<number | null>(null);
	const [ballMaxDxPx, setBallMaxDxPx] = useState<number>(0);
	const [ballResultCm, setBallResultCm] = useState<number | null>(null);
	// 30m start (test7) timing via line crossings
	const [t7StartMs, setT7StartMs] = useState<number | null>(null);
	const [t7FinishMs, setT7FinishMs] = useState<number | null>(null);
	const [t7Secs, setT7Secs] = useState<number | null>(null);
	// Shuttle 4x10 (test8) timing via repeated crossings
	const [t8StartMs, setT8StartMs] = useState<number | null>(null);
	const [t8FinishMs, setT8FinishMs] = useState<number | null>(null);
	const [t8Secs, setT8Secs] = useState<number | null>(null);
	const t8CrossCountRef = useRef<number>(0);
	let t8PrevSide: 'left' | 'right' | null = null;
	// Sit-ups (test9) counting via torso angle
	const [t9Reps, setT9Reps] = useState<number>(0);
	const t9InCrunchRef = useRef<boolean>(false);
	// Run laps (test10)
	const [t10Laps, setT10Laps] = useState<number>(0);
	const [t10StartMs, setT10StartMs] = useState<number | null>(null);
	const [t10Secs, setT10Secs] = useState<number | null>(null);
	const unit = TEST_UNITS[id || 'test1'] || '';

    const TEST_ORDER = ['test1','test2','test3','test4','test5','test6','test7','test8','test9','test10'];
    function getNextNavigationTarget(currentId: string): string {
        const idx = TEST_ORDER.indexOf(currentId);
        if (idx === -1 || idx === TEST_ORDER.length - 1) return '/fitness-test';
        const nextId = TEST_ORDER[idx + 1];
        if (currentId === 'test3') return `/fitness-test-break/${nextId}`;
        return `/fitness-test/${nextId}`;
    }

    useEffect(() => {
        if (completed) return; // freeze message once completed
        const idleMessages = [
            'Be ready. Align yourself in the frame.',
            'Ensure proper lighting for accurate tracking.',
            'Keep the camera steady before you begin.',
        ];
        const activeMessages = [
            'Great job! Maintain your form.',
            'You are doing great. Keep going!',
            'Stay focused. Smooth and steady.',
        ];
        const arr = recording ? activeMessages : idleMessages;
        let i = 0;
        setCoachMessage(arr[0]);
        const t = window.setInterval(() => {
            i = (i + 1) % arr.length;
            setCoachMessage(arr[i]);
        }, 5000);
        return () => window.clearInterval(t);
    }, [recording, completed]);

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
                // Wait for dimensions to be ready
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
            // Load models lazily based on test
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
        // Prefer calibrated pixels-per-cm if available; else fallback heuristic
        if (pxPerCm && pxPerCm > 0) {
            const cm = boxH / pxPerCm;
            if (cm < 50 || cm > 250) return null;
            return Math.round(cm);
        }
        const ratio = boxH / frameH; // fallback
        const cm = (ratio / 0.8) * 170;
        if (cm < 50 || cm > 250) return null;
        return Math.round(cm);
    }

    async function analyzeFrame() {
        if (!videoRef.current) return;
        const video = videoRef.current;
        // If violation already shown, stop processing
        if (showViolation) return;
        try {
            // Ensure a current frame exists
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
            } else if (id === 'test3' && cocoModelRef.current && poseModelRef.current) {
                // First, person detection for consistency with height
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                // Then, pose detection for wrist/ankle distance
                let poses: any[] = [];
                try { poses = await poseModelRef.current.estimatePoses(video); } catch {}
                const pose = poses?.[0];
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        // draw person bbox (first) if present
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
                            // Prefer toes for reach; fallback to ankles
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
            } else if (id === 'test4' && cocoModelRef.current && poseModelRef.current) {
                // Person detection for count/overlay
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                // Pose for hip/ankle tracking
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
                                // Baseline capture: first ~1s after recording start
                                if (recording && baselineFramesRef.current > 0) {
                                    setJumpBaselineY(prev => prev == null ? refPoint.y : (prev * 0.9 + refPoint.y * 0.1));
                                    baselineFramesRef.current -= 1;
                                }
                                // Peak is minimum Y (higher on screen)
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
            } else if (id === 'test5' && cocoModelRef.current && poseModelRef.current) {
                // Person detection
                const predictions = await cocoModelRef.current.detect(video);
                const persons = predictions.filter((p: any) => p.class === 'person' && p.score > 0.5);
                setPersonCount(persons.length);
                if (persons.length > 1) { triggerViolation(); return; }
                // Pose for feet tracking (broad jump horizontal distance)
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
                                // Capture baseline (takeoff) at first ~1s
                                if (broadBaselineFramesRef.current > 0) {
                                    setBroadBaseline(prev => prev == null ? feetFront : { x: prev.x * 0.9 + feetFront.x * 0.1, y: prev.y * 0.9 + feetFront.y * 0.1 });
                                    broadBaselineFramesRef.current -= 1;
                                }
                                // Track max horizontal displacement from baseline X
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
            } else if (id === 'test6') {
                // Optional person detection to enforce single subject
                if (cocoModelRef.current) {
                    const preds = await cocoModelRef.current.detect(video);
                    const persons = preds.filter((p: any) => p.class === 'person' && p.score > 0.5);
                    setPersonCount(persons.length);
                    if (persons.length > 1) { triggerViolation(); return; }
                }
                // Medicine ball: simple motion tracking centroid
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
                            if (diff > 60) { // motion threshold
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
            } else if (id === 'test7' && cocoModelRef.current) {
                // 30m start: detect crossing start (20% w) to finish (80% w)
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
                            // start timing when crosses start line from left to right
                            if (!t7StartMs && cx >= xStart) setT7StartMs(performance.now());
                            if (t7StartMs && !t7FinishMs && cx >= xFinish) {
                                const fin = performance.now();
                                setT7FinishMs(fin);
                                setT7Secs(Math.round(((fin - t7StartMs) / 1000) * 100) / 100);
                            }
                        }
                    }
                }
            } else if (id === 'test8' && cocoModelRef.current && poseModelRef.current) {
                // Shuttle: cross between two lines 8 times
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
            } else if (id === 'test9' && poseModelRef.current) {
                // Enforce single person using coco if available
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
                                // Angle at hip between torso(hip->shoulder) and thigh(hip->knee)
                                const angle = angleBetween(shoulder, hip, knee);
                                // Count when crunch (angle < 60) then extend (angle > 120)
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
            } else if (id === 'test10' && cocoModelRef.current && poseModelRef.current) {
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
                            // Increment laps on each crossing mid line from left to right
                            // track previous side via static variable
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

    function triggerViolation() {
        // Stop any ongoing recording
        try {
            if (recorderRef.current && recording) {
                recorderRef.current.stop();
            }
        } catch {}
        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setRecording(false);
        setShowViolation(true);
    }

    function averagePoints(a?: {x:number;y:number;score?:number}, b?: {x:number;y:number;score?:number}) {
        const minScore = 0.3;
        const aOk = a && (a.score === undefined || a.score >= minScore);
        const bOk = b && (b.score === undefined || b.score >= minScore);
        if (aOk && bOk) return { x: (a!.x + b!.x)/2, y: (a!.y + b!.y)/2 };
        if (aOk) return { x: a!.x, y: a!.y };
        if (bOk) return { x: b!.x, y: b!.y };
        return null;
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

    // Calibration using A4 sheet (29.7 cm height). Detect largest rectangle with ~1.41 aspect.
    async function calibrateWithA4() {
        if (!videoRef.current) return;
        const cv = (window as unknown as { cv?: any }).cv;
        if (!cv) { setError('OpenCV not loaded yet'); return; }
        try {
            setCalibrating(true);
            const video = videoRef.current as HTMLVideoElement;
            const w = video.videoWidth || video.clientWidth;
            const h = video.videoHeight || video.clientHeight;
            // Draw current frame to offscreen canvas to avoid VideoCapture size issues
            const off = document.createElement('canvas');
            off.width = w;
            off.height = h;
            const octx = off.getContext('2d');
            if (!octx) throw new Error('Canvas context unavailable');
            octx.drawImage(video, 0, 0, w, h);
            const src = cv.imread(off);
            const gray = new cv.Mat();
            const blur = new cv.Mat();
            const edges = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0, 0, cv.BORDER_DEFAULT);
            cv.Canny(blur, edges, 50, 150);
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            let bestH = 0;
            let bestWH: [number, number] | null = null;
            for (let i = 0; i < contours.size(); i++) {
                const cnt = contours.get(i);
                const peri = cv.arcLength(cnt, true);
                const approx = new cv.Mat();
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                if (approx.rows === 4) {
                    const rect = cv.boundingRect(approx);
                    const ar = rect.width / rect.height;
                    const arInv = rect.height / rect.width;
                    const ratio = Math.max(ar, arInv);
                    // A4 aspect ~ 1.414; accept tolerance
                    if (ratio > 1.3 && ratio < 1.5) {
                        if (rect.height > bestH) {
                            bestH = rect.height;
                            bestWH = [rect.width, rect.height];
                        }
                    }
                }
                approx.delete();
                cnt.delete();
            }
            const A4_HEIGHT_CM = 29.7;
            if (bestWH) {
                const pixels = bestWH[1];
                const scale = pixels / A4_HEIGHT_CM; // px/cm
                if (scale > 0) setPxPerCm(scale);
                setError(null);
            } else {
                setError('Calibration failed. Ensure an A4 sheet fully visible in frame.');
            }
            // cleanup
            src.delete(); gray.delete(); blur.delete(); edges.delete(); contours.delete(); hierarchy.delete();
        } catch (e: any) {
            setError(e?.message || 'Calibration error');
        } finally {
            setCalibrating(false);
        }
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
		// Initialize jump baseline capture window
		if (id === 'test4') {
			setJumpBaselineY(null);
			setJumpPeakY(null);
			setJumpResultCm(null);
			baselineFramesRef.current = 30; // ~1s at 30fps
		}
		// Initialize broad jump baseline capture window
		if (id === 'test5') {
			setBroadBaseline(null);
			setBroadMaxPoint(null);
			setBroadResultCm(null);
			broadBaselineFramesRef.current = 30; // ~1s
		}
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

    async function uploadBlob(_blob: Blob) {
        if (!id) return;
        setSaving(true);
        // Mock save: brief delay then proceed
        await new Promise((r) => setTimeout(r, 150));
        setCompleted(true);
        setCoachMessage('You have done great! Preparing next test...');
        const target = getNextNavigationTarget(id);
        setSaving(false);
        setTimeout(() => navigate(target), 250);
    }

    // Weight test (test2) remains manual input only (mock save)
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
                            if (!id) return;
                            const num = Number(inputValue);
                            if (Number.isNaN(num)) { setError('Enter a valid number'); return; }
                            setSaving(true);
                            await new Promise((r) => setTimeout(r, 150));
                            setSaving(false);
                            setCoachMessage('You have done great! Preparing next test...');
                            const target = getNextNavigationTarget(id);
                            setTimeout(() => navigate(target), 250);
                        }} disabled={saving} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Submit'}</button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="mx-auto max-w-lg" title={id === 'test1' ? 'Capture Height (Anti-cheat enabled)' : (id === 'test3' ? 'Sit and Reach (Flexibility)' : 'Record Test')}>
            <div className="space-y-3">
                <div className="relative">
                    <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                    {recording && (
                        <div className="absolute top-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span>{String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')} REC</span>
                        </div>
                    )}
                </div>
                {showViolation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="w-full max-w-sm rounded bg-white p-4 text-gray-900">
                            <h4 className="text-base font-semibold">Test Violation</h4>
                            <p className="mt-2 text-sm">More than one person detected in frame. Please perform the test again alone.</p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={() => { setShowViolation(false); navigate('/fitness-test'); }} className="rounded bg-black px-3 py-1.5 text-white">OK</button>
                            </div>
                        </div>
                    </div>
                )}
                {(id === 'test1' || id === 'test3' || id === 'test4' || id === 'test5' || id === 'test6' || id === 'test7' || id === 'test8' || id === 'test9' || id === 'test10') && (
                    <div className="text-xs text-gray-400">
                        <span>People detected: {personCount}</span>
                        {id === 'test1' && estimatedHeightCm ? <span className="ml-2">Estimated height: {estimatedHeightCm} cm</span> : null}
                        {id === 'test3' && (pxPerCm ? <span className="ml-2">Reach distance: {estimatedHeightCm ?? '-'} cm</span> : <span className="ml-2 text-yellow-400">Calibrate to get cm</span>)}
                        {id === 'test4' && (pxPerCm ? <span className="ml-2">Jump height: {jumpResultCm ?? '-'} cm</span> : <span className="ml-2 text-yellow-400">Calibrate to get cm</span>)}
                        {id === 'test5' && (pxPerCm ? <span className="ml-2">Broad jump: {broadResultCm ?? '-'} cm</span> : <span className="ml-2 text-yellow-400">Calibrate to get cm</span>)}
                        {id === 'test6' && (pxPerCm ? <span className="ml-2">Ball throw: {ballResultCm ?? '-'} cm</span> : <span className="ml-2 text-yellow-400">Calibrate to get cm</span>)}
                        {id === 'test7' && <span className="ml-2">30m time: {t7Secs ?? '-'} s</span>}
                        {id === 'test8' && <span className="ml-2">Shuttle time: {t8Secs ?? '-'} s</span>}
                        {id === 'test9' && <span className="ml-2">Sit-ups: {t9Reps}</span>}
                        {id === 'test10' && <span className="ml-2">Laps: {t10Laps} {t10Secs ? `(time: ${t10Secs}s)` : ''}</span>}
                        <div className="mt-2 flex items-center gap-2">
                            <button onClick={calibrateWithA4} disabled={calibrating} className="rounded border px-2 py-1">{calibrating ? 'Calibrating…' : 'Calibrate with A4'}</button>
                            {pxPerCm && <span className="text-green-400">Calibrated</span>}
                        </div>
                    </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="rounded border px-3 py-1.5">Back</button>
                    <button onClick={startCamera} className="rounded border px-3 py-1.5">Start Camera</button>
                    {id === 'test1' ? (
                        <button onClick={async () => {
                            if (!videoRef.current || !user) return;
                            if (personCount !== 1) { setError('Exactly one person must be in frame'); return; }
                            // capture current frame
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
                                    const file = new File([blob], `${id}_${user.uid}_${Date.now()}.png`, { type: 'image/png' });
                                    const { supabase } = await import('../lib/supabase');
                                    const path = `${user.uid}/${file.name}`;
                                    const { error: upErr } = await supabase.storage.from('Fitness-Test').upload(path, file, { contentType: 'image/png', upsert: false });
                                    if (upErr) throw upErr;
                                    const { data } = supabase.storage.from('Fitness-Test').getPublicUrl(path);
                                    const imageUrl = data.publicUrl;
                                    // Mock save for height snapshot as well
                                    await new Promise((r) => setTimeout(r, 150));
                                    setCompleted(true);
                                    setCoachMessage('You have done great! Preparing next test...');
                                    const target = getNextNavigationTarget(id);
                                    setTimeout(() => navigate(target), 250);
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
                {/* AI Coach Panel */}
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6"/><path d="M6 20v-4"/><path d="M18 20v-8"/><path d="M2 12l10-9 10 9"/></svg>
                        </span>
                        <span className="font-semibold text-gray-200">AI Coach</span>
                    </div>
                    <p className="mt-1 text-gray-300">{coachMessage}</p>
                </div>
            </div>
        </Card>
    );
}
