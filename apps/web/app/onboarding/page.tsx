'use client'

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { COUNTRIES } from "@/lib/constants/countries"
import { useTranslations } from 'next-intl'

// Step indicator component
function StepIndicator({ currentStep, totalSteps, labels }: { currentStep: number, totalSteps: number, labels: string[] }) {
    const steps = [
        { num: 1, label: labels[0] },
        { num: 2, label: labels[1] },
        { num: 3, label: labels[2] },
        { num: 4, label: labels[3] },
    ]

    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, idx) => (
                <div key={step.num} className="flex items-center">
                    <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm
                        transition-all duration-300
                        ${currentStep >= step.num
                            ? 'bg-white text-blue-600'
                            : 'bg-white/20 text-white/60'}
                    `}>
                        {currentStep > step.num ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : step.num}
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${currentStep > step.num ? 'bg-white' : 'bg-white/20'
                            }`} />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function OnboardingPage() {
    const t = useTranslations('onboarding')
    const router = useRouter()
    const { update: updateSession } = useSession()
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [hotelId, setHotelId] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
    const [importResult, setImportResult] = useState<{ count: number, valid: boolean } | null>(null)
    const [maxRooms, setMaxRooms] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        country: "VN",
        companyEmail: "",
        phone: "",
        basePrice: "",
        priceFloor: "",
        priceCeiling: "",
    })

    // Fetch purchased band → derive max rooms for capacity input
    useEffect(() => {
        const BAND_MAX: Record<string, number> = { R30: 30, R80: 80, R150: 150, R300P: 9999 };
        fetch('/api/payments/pending-activation')
            .then(r => r.json())
            .then(data => {
                if (data.hasPendingActivation && data.transaction?.roomBand) {
                    const max = BAND_MAX[data.transaction.roomBand] ?? 30;
                    setMaxRooms(max);
                    // Pre-fill capacity with max rooms
                    setFormData(prev => ({ ...prev, capacity: String(max) }));
                }
            })
            .catch(() => { /* ignore */ });
    }, []);

    // Format number with thousands separator (Vietnamese style: 1.000.000)
    const formatNumber = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '')
        if (!digits) return ''
        // Add dots as thousands separator
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    // Parse formatted number back to digits
    const parseNumber = (value: string) => {
        return value.replace(/\./g, '')
    }

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Special handler for price fields with formatting
    const updatePriceField = (field: string, value: string) => {
        const formatted = formatNumber(value)
        setFormData(prev => ({ ...prev, [field]: formatted }))
    }

    // Step 1 & 2: Create hotel
    const createHotel = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    capacity: parseInt(formData.capacity),
                    currency: formData.currency,
                    timezone: formData.timezone,
                    country: formData.country,
                    companyEmail: formData.companyEmail || null,
                    phone: formData.phone,
                    basePrice: formData.basePrice ? parseFloat(parseNumber(formData.basePrice)) : null,
                    priceFloor: formData.priceFloor ? parseFloat(parseNumber(formData.priceFloor)) : null,
                    priceCeiling: formData.priceCeiling ? parseFloat(parseNumber(formData.priceCeiling)) : null,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setHotelId(data.hotelId)
                setCurrentStep(3)
            } else {
                const data = await res.json()
                alert(data.error || t('errorGeneric'))
            }
        } catch (error) {
            alert(t('errorRetry'))
        } finally {
            setLoading(false)
        }
    }

    // Step 3: File upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !hotelId) return

        setUploadStatus('uploading')

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('hotelId', hotelId)

            const res = await fetch('/api/upload/otb', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                setImportResult({
                    count: data.importedCount || 0,
                    valid: (data.importedCount || 0) >= 10 // Quality import threshold
                })
                setUploadStatus('success')
            } else {
                setUploadStatus('error')
            }
        } catch (error) {
            setUploadStatus('error')
        }
    }

    // Step 4: Complete onboarding
    const completeOnboarding = async () => {
        setLoading(true)
        try {
            // If quality import, trigger trial
            if (importResult?.valid && hotelId) {
                await fetch('/api/trial/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hotelId }),
                })
            }

            // Mark onboarding complete (API links payment, creates subscription,
            // removes Demo Hotel, and sets rms_active_hotel cookie)
            console.log('[Onboarding] 🔄 Completing onboarding for hotel:', hotelId)
            const completeRes = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId }),
            })
            const completeData = await completeRes.json()
            console.log('[Onboarding] 📦 Complete response:', JSON.stringify(completeData))

            if (!completeRes.ok) {
                console.error('[Onboarding] ❌ Complete failed:', completeData.error)
                alert(t('errorComplete', { error: completeData.error || 'Unknown error' }))
                setLoading(false)
                return // STOP! Don't navigate to dashboard with broken state
            }

            // Force JWT session refresh so middleware sees updated accessibleHotels
            // This re-queries hotel_users from DB (Demo Hotel should be removed by now)
            console.log('[Onboarding] 🔑 Refreshing JWT session...')
            await updateSession()
            console.log('[Onboarding] ✅ JWT session refreshed')

            // Small delay to ensure cookies (both rms_active_hotel and JWT session)
            // are fully processed by the browser before navigation
            await new Promise(resolve => setTimeout(resolve, 300))

            // Hard redirect to force full page load with fresh cookies
            console.log('[Onboarding] 🚀 Navigating to /dashboard')
            window.location.href = '/dashboard'
        } catch (error) {
            console.error('[Onboarding] ❌ Error during completion:', error)
            // DO NOT navigate to dashboard on error — user would see Demo Hotel with wrong plan
            alert(t('errorCompleteGeneric'))
        } finally {
            setLoading(false)
        }
    }

    const inputStyles = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
    const labelStyles = "block text-sm font-medium text-white/80 mb-1"

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4">
            {/* Background with gradient layers */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 20%, rgba(32, 65, 132, 0.4) 0%, transparent 50%),
                        linear-gradient(180deg, 
                            #0f172a 0%, 
                            #1e3a5f 30%, 
                            #204184 60%, 
                            #3b82f6 85%,
                            #93c5fd 100%
                        )
                    `
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 w-full max-w-2xl mx-auto">
                {/* Logo Badge */}
                <div className="flex justify-center mb-6">
                    <div
                        className="p-3 rounded-2xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        <Image
                            src="/logo.jpg"
                            alt="4TK Hospitality"
                            width={140}
                            height={48}
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Step Indicator */}
                <StepIndicator currentStep={currentStep} totalSteps={4} labels={[t('stepInfo'), t('stepPricing'), t('stepData'), t('stepComplete')]} />

                {/* Glass Card */}
                <div
                    className="rounded-3xl p-8"
                    style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    }}
                >
                    {/* Step 1: Hotel Info */}
                    {currentStep === 1 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                {t('step1Title')}
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                {t('step1Subtitle')}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyles}>{t('hotelName')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => updateFormData('name', e.target.value)}
                                        className={inputStyles}
                                        placeholder={t('hotelNamePlaceholder')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>{t('roomCount')}</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max={maxRooms ?? undefined}
                                            value={formData.capacity}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (maxRooms && parseInt(val) > maxRooms) val = String(maxRooms);
                                                updateFormData('capacity', val);
                                            }}
                                            className={inputStyles}
                                            placeholder={maxRooms ? t('roomCountMax', { max: maxRooms }) : 'E.g: 120'}
                                        />
                                        {maxRooms && (
                                            <p className="text-xs text-blue-400 mt-1">{t('roomBandNote', { max: maxRooms })}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelStyles}>{t('country')}</label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) => updateFormData('country', e.target.value)}
                                            className={inputStyles}
                                        >
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code} className="bg-slate-800">
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>{t('currency')}</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => updateFormData('currency', e.target.value)}
                                            className={inputStyles}
                                        >
                                            <option value="VND" className="bg-slate-800">VND - Vietnamese Dong</option>
                                            <option value="USD" className="bg-slate-800">USD - US Dollar</option>
                                            <option value="EUR" className="bg-slate-800">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelStyles}>{t('timezone')}</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => updateFormData('timezone', e.target.value)}
                                            className={inputStyles}
                                        >
                                            <option value="Asia/Ho_Chi_Minh" className="bg-slate-800">Vietnam (GMT+7)</option>
                                            <option value="Asia/Bangkok" className="bg-slate-800">Thailand (GMT+7)</option>
                                            <option value="Asia/Singapore" className="bg-slate-800">Singapore (GMT+8)</option>
                                            <option value="Asia/Tokyo" className="bg-slate-800">Japan (GMT+9)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelStyles}>{t('phone')}</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value)}
                                        className={inputStyles}
                                        placeholder={t('phonePlaceholder')}
                                    />
                                </div>

                                <div>
                                    <label className={labelStyles}>{t('hotelEmail')}</label>
                                    <input
                                        type="email"
                                        value={formData.companyEmail}
                                        onChange={(e) => updateFormData('companyEmail', e.target.value)}
                                        className={inputStyles}
                                        placeholder="contact@hotel.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                disabled={!formData.name || !formData.capacity || !formData.phone || !formData.country}
                                className="w-full mt-6 py-3 px-6 bg-white text-blue-600 font-medium rounded-xl 
                                    hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('next')}
                            </button>
                        </>
                    )}

                    {/* Step 2: Pricing Config */}
                    {currentStep === 2 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                {t('step2Title')}
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                {t('step2Subtitle')}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyles}>{t('basePrice')}</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.basePrice}
                                        onChange={(e) => updatePriceField('basePrice', e.target.value)}
                                        className={inputStyles}
                                        placeholder={t('basePricePlaceholder')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>{t('priceFloor')}</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatNumber(formData.priceFloor)}
                                            onChange={(e) => updatePriceField('priceFloor', e.target.value)}
                                            className={inputStyles}
                                            placeholder={t('priceFloorPlaceholder')}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelStyles}>{t('priceCeiling')}</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatNumber(formData.priceCeiling)}
                                            onChange={(e) => updatePriceField('priceCeiling', e.target.value)}
                                            className={inputStyles}
                                            placeholder={t('priceCeilingPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <p className="text-white/50 text-sm">
                                    {t('priceSkipNote')}
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="flex-1 py-3 px-6 bg-white/20 text-white font-medium rounded-xl 
                                        hover:bg-white/30 transition-all"
                                >
                                    {t('back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={createHotel}
                                    disabled={loading}
                                    className="flex-1 py-3 px-6 bg-white text-blue-600 font-medium rounded-xl 
                                        hover:bg-white/90 transition-all disabled:opacity-50"
                                >
                                    {loading ? t('creating') : t('next')}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Data Upload */}
                    {currentStep === 3 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                {t('step3Title')}
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                {t('step3Subtitle')}
                            </p>

                            <div className="space-y-4">
                                {uploadStatus === 'idle' && (
                                    <>
                                        <label className="block">
                                            <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center cursor-pointer hover:border-white/50 transition-all">
                                                <svg className="w-12 h-12 mx-auto mb-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-white/80 font-medium mb-1">{t('dropzone')}</p>
                                                <p className="text-white/50 text-sm">{t('fileTypes')}</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Sample file download */}
                                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-white/70 text-sm mb-2"><strong>{t('requiredFields')}</strong></p>
                                            <ul className="text-white/50 text-xs space-y-1 mb-3">
                                                <li>• <code className="bg-white/10 px-1 rounded">reservation_id</code> - {t('fieldReservationId')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">booking_date</code> - {t('fieldBookingDate')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">arrival_date</code> - {t('fieldArrivalDate')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">departure_date</code> - {t('fieldDepartureDate')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">rooms</code> - {t('fieldRooms')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">revenue</code> - {t('fieldRevenue')}</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">status</code> - {t('fieldStatus')}</li>
                                            </ul>
                                            <a
                                                href="/sample-reservations.csv"
                                                download="sample-reservations.csv"
                                                className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {t('downloadSample')}
                                            </a>
                                        </div>
                                    </>
                                )}

                                {uploadStatus === 'uploading' && (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-white/80">{t('uploading')}</p>
                                    </div>
                                )}

                                {uploadStatus === 'success' && importResult && (
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-white font-medium mb-1">{t('importSuccess', { count: importResult.count })}</p>
                                        {importResult.valid ? (
                                            <p className="text-green-300 text-sm">
                                                {t('trialEligible')}
                                            </p>
                                        ) : (
                                            <p className="text-yellow-300 text-sm">
                                                {t('trialMinimum')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {uploadStatus === 'error' && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
                                        <p className="text-white mb-2">{t('uploadError')}</p>
                                        <button
                                            onClick={() => setUploadStatus('idle')}
                                            className="text-red-300 underline text-sm"
                                        >
                                            {t('retry')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(4)}
                                    className="w-full py-3 px-6 bg-white text-blue-600 font-medium rounded-xl 
                                        hover:bg-white/90 transition-all"
                                >
                                    {uploadStatus === 'success' ? t('nextStep') : t('skipStep')}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 4 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                {t('step4Title')}
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                {t('step4Subtitle')}
                            </p>

                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-2xl p-6">
                                    <h3 className="text-white font-medium mb-3">{t('setupSummary')}</h3>
                                    <div className="space-y-2 text-white/80 text-sm">
                                        <p><strong>{formData.name}</strong></p>
                                        <p>{t('roomsCount', { count: formData.capacity })}</p>
                                        <p>{formData.currency}</p>
                                        {importResult?.count && (
                                            <p>{t('importedBookings', { count: importResult.count })}</p>
                                        )}
                                    </div>
                                </div>

                                {importResult?.valid && (
                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center">
                                        <p className="text-white font-medium mb-1">{t('proTrialGranted')}</p>
                                        <p className="text-white/60 text-sm">{t('proTrialDesc')}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={completeOnboarding}
                                disabled={loading}
                                className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl 
                                    hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                            >
                                {loading ? t('completing') : t('goToDashboard')}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-sm mt-6">
                    {t('support')} <a href="https://zalo.me/0778602953" className="text-white/60 hover:text-white underline" target="_blank" rel="noopener noreferrer">0778.602.953</a>
                </p>
            </div>
        </div >
    )
}
