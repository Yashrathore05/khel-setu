import { useEffect, useRef, useState } from 'react';
import { generateChat, type ChatMessage } from '../services/geminiService';

export default function ChatbotPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hi! I\'m Khel Setu Coach — created to help every athlete and sports aspirant. How can I support your training today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    async function onSend() {
        const text = input.trim();
        if (!text || loading) return;
        setError(null);
        setInput('');
        const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
        setMessages(nextMessages);
        setLoading(true);
        try {
            const reply = await generateChat(nextMessages);
            setMessages((prev) => [...prev, { role: 'assistant', content: reply || '...' }]);
        } catch (e: any) {
            setError(e?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-blue-950/60 via-black/40 to-black/60 shadow-2xl backdrop-blur-md">
                <div className="relative p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-fuchsia-500/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                            <span className="text-lg">🏅</span>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold">Khel Setu Coach</h2>
                            <p className="text-xs text-gray-300">Built for every athlete and sports aspirant</p>
                        </div>
                    </div>
                </div>

                <div ref={scrollRef} className="h-[480px] overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-transparent to-black/20">
                {messages.map((m, idx) => (
                        <div key={idx} className={`flex items-start gap-3 ${m.role === 'assistant' ? '' : 'justify-end'}`}>
                            {m.role === 'assistant' && (
                                <div className="h-8 w-8 shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow">
                                    <span className="text-sm">🤖</span>
                                </div>
                            )}
                            <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-lg ${m.role === 'assistant' ? 'bg-white/5 border border-white/10' : 'bg-blue-600/20 border border-blue-500/30'} `}>
                                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-[15px]">{m.content}</p>
                            </div>
                            {m.role === 'user' && (
                                <div className="h-8 w-8 shrink-0 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shadow">
                                    <span className="text-sm">🧑‍🦽</span>
                        </div>
                            )}
                    </div>
                ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="inline-flex h-2 w-2 rounded-full bg-gray-400/70 animate-pulse"></span>
                            Thinking...
                        </div>
                    )}
            </div>

                {error && <p className="px-5 pt-3 text-sm text-red-400">{error}</p>}

                <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-black/40 border border-white/10 px-3 sm:px-4 py-2.5 shadow-inner">
                        <button className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm">+
                        </button>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
                            placeholder="Ask about training plans, tests, nutrition, recovery..."
                            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500"
                />
                <button
                    onClick={onSend}
                    disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 sm:px-4 py-2 text-sm font-medium border border-blue-400/30 shadow"
                >
                            <span>Send</span>
                </button>
            </div>
                    <p className="mt-2 text-[11px] text-gray-500">Tip: Use metric units (cm, m, kg, sec). Train safe and recover well.</p>
                </div>
            </div>
        </div>
    );
}
