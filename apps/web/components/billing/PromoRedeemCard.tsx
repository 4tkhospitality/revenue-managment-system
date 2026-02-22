'use client';

// ════════════════════════════════════════════════════════════════════
// PromoRedeemCard — User-facing promo code input + validation + redeem
// ════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Tag, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PromoRedeemCardProps {
    hotelId: string;
    onRedeemed?: (result: { promoCode: string; percentOff: number }) => void;
}

export default function PromoRedeemCard({ hotelId, onRedeemed }: PromoRedeemCardProps) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'redeeming' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [promoInfo, setPromoInfo] = useState<{ percentOff: number; description: string } | null>(null);

    async function handleValidate() {
        if (!code.trim()) return;
        setStatus('validating');

        try {
            const res = await fetch('/api/promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', code: code.trim().toUpperCase(), hotelId }),
            });
            const data = await res.json();

            if (data.valid) {
                setStatus('valid');
                setPromoInfo({ percentOff: data.promo.percentOff, description: data.promo.description || '' });
                setMessage(`Save ${data.promo.percentOff}% — Click Apply to activate`);
            } else {
                setStatus('invalid');
                setMessage(data.error || 'Invalid code');
            }
        } catch {
            setStatus('error');
            setMessage('Connection error. Please try again.');
        }
    }

    async function handleRedeem() {
        setStatus('redeeming');

        try {
            const res = await fetch('/api/promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'redeem', code: code.trim().toUpperCase(), hotelId }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(`🎉 Applied code ${data.promoCode} — Save ${data.percentOff}%`);
                onRedeemed?.({ promoCode: data.promoCode, percentOff: data.percentOff });
            } else {
                setStatus('error');
                setMessage(data.error || 'Cannot apply code');
            }
        } catch {
            setStatus('error');
            setMessage('Connection error. Please try again.');
        }
    }

    const statusColor = {
        idle: '#6b7280',
        validating: '#2563eb',
        valid: '#16a34a',
        invalid: '#dc2626',
        redeeming: '#2563eb',
        success: '#16a34a',
        error: '#dc2626',
    }[status];

    return (
        <div style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Tag size={18} color="#7c3aed" />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Promo Code</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: `1px solid ${status === 'valid' ? '#16a34a' : status === 'invalid' ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        fontFamily: 'monospace',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    placeholder="Enter code..."
                    value={code}
                    onChange={e => {
                        setCode(e.target.value.toUpperCase());
                        if (status !== 'idle') setStatus('idle');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleValidate()}
                    disabled={status === 'success'}
                />

                {status === 'valid' ? (
                    <button
                        onClick={handleRedeem}
                        disabled={status === 'redeeming' as string}
                        style={{
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {status === ('redeeming' as string) ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Apply
                    </button>
                ) : (
                    <button
                        onClick={handleValidate}
                        disabled={!code.trim() || status === 'validating'}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: code.trim() ? 'pointer' : 'not-allowed',
                            opacity: code.trim() ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {status === 'validating' ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                        Verify
                    </button>
                )}
            </div>

            {message && (
                <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: status === 'success' || status === 'valid' ? '#f0fdf4' : status === 'invalid' || status === 'error' ? '#fef2f2' : '#f0f9ff',
                    color: statusColor,
                }}>
                    {status === 'success' || status === 'valid' ? <Check size={14} /> : <AlertCircle size={14} />}
                    {message}
                </div>
            )}
        </div>
    );
}
