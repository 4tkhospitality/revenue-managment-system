'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        companyEmail: "",
        basePrice: "",
        priceFloor: "",
        priceCeiling: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
                    companyEmail: formData.companyEmail || null,
                    basePrice: formData.basePrice ? parseFloat(formData.basePrice) : null,
                    priceFloor: formData.priceFloor ? parseFloat(formData.priceFloor) : null,
                    priceCeiling: formData.priceCeiling ? parseFloat(formData.priceCeiling) : null,
                }),
            })

            if (res.ok) {
                router.push("/dashboard")
                router.refresh()
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
                <div className="flex justify-center mb-8">
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        <Image
                            src="/logo.jpg"
                            alt="4TK Hospitality"
                            width={160}
                            height={56}
                            className="object-contain"
                        />
                    </div>
                </div>

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
                    <h1 className="text-2xl font-semibold text-white mb-2" style={{ letterSpacing: '0.025em' }}>
                        Chào mừng đến với RMS! 🎉
                    </h1>
                    <p className="text-white/70 mb-8 text-[15px]">
                        Hãy thiết lập khách sạn của bạn để bắt đầu
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Required Fields */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                                Thông tin bắt buộc
                            </h2>

                            <div>
                                <label className={labelStyles}>
                                    Tên khách sạn *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={inputStyles}
                                    placeholder="VD: Sunrise Beach Resort"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyles}>
                                        Số phòng *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        className={inputStyles}
                                        placeholder="VD: 120"
                                    />
                                </div>

                                <div>
                                    <label className={labelStyles}>
                                        Tiền tệ *
                                    </label>
                                    <select
                                        required
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className={inputStyles}
                                    >
                                        <option value="VND" className="bg-slate-800">VND - Việt Nam Đồng</option>
                                        <option value="USD" className="bg-slate-800">USD - US Dollar</option>
                                        <option value="EUR" className="bg-slate-800">EUR - Euro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelStyles}>
                                    Múi giờ *
                                </label>
                                <select
                                    required
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className={inputStyles}
                                >
                                    <option value="Asia/Ho_Chi_Minh" className="bg-slate-800">Việt Nam (GMT+7)</option>
                                    <option value="Asia/Bangkok" className="bg-slate-800">Thái Lan (GMT+7)</option>
                                    <option value="Asia/Singapore" className="bg-slate-800">Singapore (GMT+8)</option>
                                    <option value="Asia/Tokyo" className="bg-slate-800">Nhật Bản (GMT+9)</option>
                                </select>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/10" />

                        {/* Optional Fields */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                                Thông tin tùy chọn
                            </h2>

                            <div>
                                <label className={labelStyles}>
                                    Email liên hệ
                                </label>
                                <input
                                    type="email"
                                    value={formData.companyEmail}
                                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                                    className={inputStyles}
                                    placeholder="VD: booking@sunrise-resort.com"
                                />
                                <p className="text-xs text-white/40 mt-1">
                                    Dùng cho báo cáo và xuất file
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelStyles}>
                                        Giá cơ bản
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className={inputStyles}
                                        placeholder="1,500,000"
                                    />
                                </div>

                                <div>
                                    <label className={labelStyles}>
                                        Giá sàn
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priceFloor}
                                        onChange={(e) => setFormData({ ...formData, priceFloor: e.target.value })}
                                        className={inputStyles}
                                        placeholder="1,000,000"
                                    />
                                </div>

                                <div>
                                    <label className={labelStyles}>
                                        Giá trần
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priceCeiling}
                                        onChange={(e) => setFormData({ ...formData, priceCeiling: e.target.value })}
                                        className={inputStyles}
                                        placeholder="3,000,000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#1e3a5f',
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            {loading ? "Đang xử lý..." : "Bắt đầu sử dụng RMS →"}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-xs mt-8 leading-relaxed">
                    © 2026 - Phát triển bởi công ty quản lý<br />
                    vận hành khách sạn 4TK Hospitality
                </p>
            </div>
        </div>
    )
}
