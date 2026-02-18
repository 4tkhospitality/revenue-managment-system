'use client'

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { COUNTRIES } from "@/lib/constants/countries"

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) {
    const steps = [
        { num: 1, label: "Thông tin" },
        { num: 2, label: "Giá cả" },
        { num: 3, label: "Dữ liệu" },
        { num: 4, label: "Hoàn tất" },
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
    const router = useRouter()
    const { update: updateSession } = useSession()
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [hotelId, setHotelId] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
    const [importResult, setImportResult] = useState<{ count: number, valid: boolean } | null>(null)

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
                alert(data.error || "Có lỗi xảy ra")
            }
        } catch (error) {
            alert("Có lỗi xảy ra. Vui lòng thử lại.")
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
            // Even on error, try to navigate
            window.location.href = '/dashboard'
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
                <StepIndicator currentStep={currentStep} totalSteps={4} />

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
                                Thông tin khách sạn
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                Bước 1/4: Nhập thông tin cơ bản
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyles}>Tên khách sạn / Resort *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => updateFormData('name', e.target.value)}
                                        className={inputStyles}
                                        placeholder="VD: Sunrise Beach Resort"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>Số phòng *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => updateFormData('capacity', e.target.value)}
                                            className={inputStyles}
                                            placeholder="VD: 120"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelStyles}>Quốc gia *</label>
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
                                        <label className={labelStyles}>Tiền tệ *</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => updateFormData('currency', e.target.value)}
                                            className={inputStyles}
                                        >
                                            <option value="VND" className="bg-slate-800">VND - Việt Nam Đồng</option>
                                            <option value="USD" className="bg-slate-800">USD - US Dollar</option>
                                            <option value="EUR" className="bg-slate-800">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelStyles}>Múi giờ *</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => updateFormData('timezone', e.target.value)}
                                            className={inputStyles}
                                        >
                                            <option value="Asia/Ho_Chi_Minh" className="bg-slate-800">Việt Nam (GMT+7)</option>
                                            <option value="Asia/Bangkok" className="bg-slate-800">Thái Lan (GMT+7)</option>
                                            <option value="Asia/Singapore" className="bg-slate-800">Singapore (GMT+8)</option>
                                            <option value="Asia/Tokyo" className="bg-slate-800">Nhật Bản (GMT+9)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelStyles}>Số điện thoại di động *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value)}
                                        className={inputStyles}
                                        placeholder="VD: 0901234567"
                                    />
                                </div>

                                <div>
                                    <label className={labelStyles}>Email của Khách sạn / Resort (tùy chọn)</label>
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
                                Tiếp theo →
                            </button>
                        </>
                    )}

                    {/* Step 2: Pricing Config */}
                    {currentStep === 2 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                Cấu hình giá
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                Bước 2/4: Thiết lập giá phòng (tùy chọn, có thể bỏ qua)
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyles}>Giá cơ sở / đêm</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.basePrice}
                                        onChange={(e) => updatePriceField('basePrice', e.target.value)}
                                        className={inputStyles}
                                        placeholder="VD: 1.500.000"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyles}>Giá sàn (tối thiểu)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatNumber(formData.priceFloor)}
                                            onChange={(e) => updatePriceField('priceFloor', e.target.value)}
                                            className={inputStyles}
                                            placeholder="VD: 800.000"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelStyles}>Giá trần (tối đa)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatNumber(formData.priceCeiling)}
                                            onChange={(e) => updatePriceField('priceCeiling', e.target.value)}
                                            className={inputStyles}
                                            placeholder="VD: 3.000.000"
                                        />
                                    </div>
                                </div>

                                <p className="text-white/50 text-sm">
                                    Bạn có thể thiết lập sau trong phần Cài đặt
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="flex-1 py-3 px-6 bg-white/20 text-white font-medium rounded-xl 
                                        hover:bg-white/30 transition-all"
                                >
                                    ← Quay lại
                                </button>
                                <button
                                    type="button"
                                    onClick={createHotel}
                                    disabled={loading}
                                    className="flex-1 py-3 px-6 bg-white text-blue-600 font-medium rounded-xl 
                                        hover:bg-white/90 transition-all disabled:opacity-50"
                                >
                                    {loading ? "Đang tạo..." : "Tiếp theo →"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Data Upload */}
                    {currentStep === 3 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                Nhập dữ liệu
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                Bước 3/4: Upload dữ liệu đặt phòng để bắt đầu phân tích
                            </p>

                            <div className="space-y-4">
                                {uploadStatus === 'idle' && (
                                    <>
                                        <label className="block">
                                            <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center cursor-pointer hover:border-white/50 transition-all">
                                                <svg className="w-12 h-12 mx-auto mb-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-white/80 font-medium mb-1">Kéo thả file hoặc click để chọn</p>
                                                <p className="text-white/50 text-sm">Excel (.xlsx, .xls) hoặc CSV</p>
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
                                            <p className="text-white/70 text-sm mb-2"><strong>Các trường bắt buộc:</strong></p>
                                            <ul className="text-white/50 text-xs space-y-1 mb-3">
                                                <li>• <code className="bg-white/10 px-1 rounded">reservation_id</code> - Mã đặt phòng</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">booking_date</code> - Ngày đặt (YYYY-MM-DD)</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">arrival_date</code> - Ngày nhận phòng (YYYY-MM-DD)</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">departure_date</code> - Ngày trả phòng (YYYY-MM-DD)</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">rooms</code> - Số phòng đặt</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">revenue</code> - Doanh thu</li>
                                                <li>• <code className="bg-white/10 px-1 rounded">status</code> - Trạng thái (booked / cancelled)</li>
                                            </ul>
                                            <a
                                                href="/sample-reservations.csv"
                                                download="sample-reservations.csv"
                                                className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Tải file mẫu (CSV)
                                            </a>
                                        </div>
                                    </>
                                )}

                                {uploadStatus === 'uploading' && (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-white/80">Đang xử lý dữ liệu...</p>
                                    </div>
                                )}

                                {uploadStatus === 'success' && importResult && (
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-white font-medium mb-1">Đã nhập {importResult.count} bản ghi</p>
                                        {importResult.valid ? (
                                            <p className="text-green-300 text-sm">
                                                Đủ điều kiện nhận 7 ngày dùng thử Pro!
                                            </p>
                                        ) : (
                                            <p className="text-yellow-300 text-sm">
                                                Cần tối thiểu 10 đặt phòng để kích hoạt dùng thử
                                            </p>
                                        )}
                                    </div>
                                )}

                                {uploadStatus === 'error' && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
                                        <p className="text-white mb-2">Có lỗi khi xử lý file</p>
                                        <button
                                            onClick={() => setUploadStatus('idle')}
                                            className="text-red-300 underline text-sm"
                                        >
                                            Thử lại
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
                                    {uploadStatus === 'success' ? 'Tiếp theo →' : 'Bỏ qua, làm sau'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 4 && (
                        <>
                            <h1 className="text-2xl font-semibold text-white mb-2">
                                Hoàn tất!
                            </h1>
                            <p className="text-white/70 mb-6 text-[15px]">
                                Bước 4/4: Xác nhận và bắt đầu sử dụng
                            </p>

                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-2xl p-6">
                                    <h3 className="text-white font-medium mb-3">Tổng kết thiết lập:</h3>
                                    <div className="space-y-2 text-white/80 text-sm">
                                        <p><strong>{formData.name}</strong></p>
                                        <p>{formData.capacity} phòng</p>
                                        <p>{formData.currency}</p>
                                        {importResult?.count && (
                                            <p>{importResult.count} đặt phòng đã nhập</p>
                                        )}
                                    </div>
                                </div>

                                {importResult?.valid && (
                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center">
                                        <p className="text-white font-medium mb-1">Bạn đã được tặng 7 ngày Pro Trial!</p>
                                        <p className="text-white/60 text-sm">Trải nghiệm đầy đủ tính năng phân tích & báo cáo</p>
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
                                {loading ? "Đang hoàn tất..." : "Vào Dashboard →"}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-sm mt-6">
                    Cần hỗ trợ? Liên hệ Zalo: <a href="https://zalo.me/0778602953" className="text-white/60 hover:text-white underline" target="_blank" rel="noopener noreferrer">0778.602.953</a>
                </p>
            </div>
        </div >
    )
}
