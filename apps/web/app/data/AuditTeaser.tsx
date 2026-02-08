'use client'

interface AuditTeaserProps {
    issueCount: number
    onUpgrade: () => void
}

export default function AuditTeaser({ issueCount, onUpgrade }: AuditTeaserProps) {
    return (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex items-start gap-4">
                <div className="text-4xl">🔍</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                        Phát hiện {issueCount} vấn đề về dữ liệu
                    </h3>
                    <p className="text-sm text-white/60 mb-4">
                        Báo cáo kiểm tra chi tiết có thể giúp bạn cải thiện chất lượng dữ liệu và dự báo chính xác hơn.
                    </p>
                    <button
                        onClick={onUpgrade}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition"
                    >
                        Xem báo cáo đầy đủ (Pro)
                    </button>
                </div>
            </div>
        </div>
    )
}
