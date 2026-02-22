/**
 * Phase 02 — Automated i18n replacement script
 * Replaces Vietnamese hardcoded strings with useTranslations/getTranslations t() calls
 * across all remaining UI files.
 */
const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');
let totalReplacements = 0;
let filesProcessed = 0;

function replaceInFile(relPath, importLine, translationInit, replacements) {
    const filePath = path.join(webDir, relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ SKIP (not found): ${relPath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let count = 0;

    // Add import if not already present
    if (importLine && !content.includes(importLine.split(' from ')[0].trim())) {
        // Find the last import line
        const importRegex = /^import .+$/gm;
        let lastImportMatch;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            lastImportMatch = match;
        }
        if (lastImportMatch) {
            const insertPos = lastImportMatch.index + lastImportMatch[0].length;
            content = content.slice(0, insertPos) + '\n' + importLine + content.slice(insertPos);
            count++;
        }
    }

    // Add translation init if not already present
    if (translationInit) {
        const initPatterns = Array.isArray(translationInit) ? translationInit : [translationInit];
        for (const init of initPatterns) {
            if (!content.includes(init.text)) {
                // Find the function/component and insert after its opening {
                const funcRegex = new RegExp(init.after.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const funcMatch = funcRegex.exec(content);
                if (funcMatch) {
                    const insertPos = funcMatch.index + funcMatch[0].length;
                    content = content.slice(0, insertPos) + '\n    ' + init.text + content.slice(insertPos);
                    count++;
                }
            }
        }
    }

    // Do replacements
    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
            count++;
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${relPath} — ${count} changes`);
        totalReplacements += count;
        filesProcessed++;
    } else {
        console.log(`⏭️ ${relPath} — no changes needed`);
    }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN USERS PAGE
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'app/admin/users/page.tsx',
    "import { useTranslations } from 'next-intl';",
    [
        { after: 'export default function AdminUsersPage() {', text: "const t = useTranslations('admin');" },
        { after: 'function CreateUserModal({', text: '' }, // Will init inside
        { after: 'function AssignHotelsModal({', text: '' },
    ],
    [
        // AdminUsersPage component
        ["if (!confirm(`${user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} người dùng ${user.email}?`)) return;",
            "if (!confirm(t('confirmToggle', { action: user.isActive ? t('deactivate') : t('activate'), email: user.email }))) return;"],
        ["if (!confirm(`⚠️ XÓA VĨNH VIỄN người dùng ${user.email}?\\n\\nHành động này không thể hoàn tác!`)) return;",
            "if (!confirm(t('confirmDeleteUser', { email: user.email }))) return;"],
        ["else alert('Có lỗi xảy ra khi xóa');", "else alert(t('errorDeleting'));"],
        // formatPayment
        ["Gói <span className=\"font-semibold text-slate-700\">{payment.tier}</span>",
            "{t('tierLabel', { tier: payment.tier })}"],
        ["{Icons.warning} Chờ onboarding", "{Icons.warning} {t('pendingOnboardingLabel')}"],
        // Auth guard
        ["<h1 className=\"text-xl font-semibold text-slate-900\">Không có quyền truy cập</h1>",
            "<h1 className=\"text-xl font-semibold text-slate-900\">{t('noAccess')}</h1>"],
        ["← Quay lại Dashboard", "{t('backToDashboard')}"],
        // Header
        ["<h1 className=\"text-lg font-semibold tracking-tight\">Quản lý người dùng</h1>",
            "<h1 className=\"text-lg font-semibold tracking-tight\">{t('usersTitle')}</h1>"],
        ["{totalUsers} người dùng · {activeUsers} hoạt động", "{t('usersCount', { total: totalUsers, active: activeUsers })}"],
        ["<span>Thêm user</span>", "<span>{t('addUser')}</span>"],
        // KPI cards
        ["{ label: 'Tổng user', value: totalUsers, color: 'text-slate-900' },",
            "{ label: t('totalUsers'), value: totalUsers, color: 'text-slate-900' },"],
        ["{ label: 'Hoạt động', value: activeUsers, color: 'text-emerald-600' },",
            "{ label: t('active'), value: activeUsers, color: 'text-emerald-600' },"],
        ["{ label: 'Đã thanh toán', value: paidUsers, color: 'text-blue-600' },",
            "{ label: t('paid'), value: paidUsers, color: 'text-blue-600' },"],
        ["{ label: 'Chờ onboarding', value: pendingOnboarding,",
            "{ label: t('pendingOnboarding'), value: pendingOnboarding,"],
        // Search
        ["placeholder=\"Tìm theo email hoặc tên...\"", "placeholder={t('searchPlaceholder')}"],
        // Loading states (mobile)
        [">Đang tải...</p>", ">{t('loading')}</p>"],
        [">Không tìm thấy người dùng</div>", ">{t('noUsersFound')}</div>"],
        // User name fallback
        ["{user.name || 'Chưa đặt tên'}", "{user.name || t('noNameSet')}"],
        // No hotel assigned
        ["<span className=\"text-slate-400 italic\">Chưa gán hotel</span>",
            "<span className=\"text-slate-400 italic\">{t('noHotelAssigned')}</span>"],
        // Mobile card actions
        ["{Icons.edit} Sửa", "{Icons.edit} {t('edit')}"],
        ["{Icons.link} Gán hotel", "{Icons.link} {t('assignHotel')}"],
        ["{user.isActive ? Icons.lock : Icons.unlock} {user.isActive ? 'Khóa' : 'Mở'}",
            "{user.isActive ? Icons.lock : Icons.unlock} {user.isActive ? t('lock') : t('unlock')}"],
        // Table headers
        [">Người dùng</th>", ">{t('userCol')}</th>"],
        [">Liên hệ</th>", ">{t('contactCol')}</th>"],
        [">Thanh toán</th>", ">{t('paymentCol')}</th>"],
        [">Trạng thái</th>", ">{t('statusCol')}</th>"],
        [">Thao tác</th>", ">{t('actionsCol')}</th>"],
        // Desktop loading
        ["Đang tải...", "{t('loading')}"],
        ["Không tìm thấy người dùng", "{t('noUsersFound')}"],
        // Status badges
        ["{user.isActive ? 'Hoạt động' : 'Đã khóa'}", "{user.isActive ? t('activeStatus') : t('lockedStatus')}"],
        // Tooltips
        ["title=\"Sửa\"", "title={t('edit')}"],
        ["title=\"Gán hotel\"", "title={t('assignHotel')}"],
        ["title={user.isActive ? 'Khóa' : 'Mở khóa'}", "title={user.isActive ? t('lock') : t('unlock')}"],
        ["title=\"Xóa vĩnh viễn\"", "title={t('deletePermanently')}"],
        // Desktop not assigned
        ["<span className=\"text-slate-300 text-xs italic\">Chưa gán</span>",
            "<span className=\"text-slate-300 text-xs italic\">{t('notAssigned')}</span>"],
    ]
);

// ── CreateUserModal (separate component in same file)
{
    const filePath = path.join(webDir, 'app/admin/users/page.tsx');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;
        let count = 0;

        // Add t to CreateUserModal
        if (!content.includes("function CreateUserModal") || !content.match(/CreateUserModal[\s\S]*?const t = useTranslations/)) {
            content = content.replace(
                "function CreateUserModal({ hotels, onClose, onCreated }: {\n    hotels: Hotel[];\n    onClose: () => void;\n    onCreated: () => void;\n}) {",
                "function CreateUserModal({ hotels, onClose, onCreated }: {\n    hotels: Hotel[];\n    onClose: () => void;\n    onCreated: () => void;\n}) {\n    const t = useTranslations('admin');"
            );
            // Also handle \r\n line endings
            content = content.replace(
                "function CreateUserModal({ hotels, onClose, onCreated }: {\r\n    hotels: Hotel[];\r\n    onClose: () => void;\r\n    onCreated: () => void;\r\n}) {",
                "function CreateUserModal({ hotels, onClose, onCreated }: {\r\n    hotels: Hotel[];\r\n    onClose: () => void;\r\n    onCreated: () => void;\r\n}) {\r\n    const t = useTranslations('admin');"
            );
            count++;
        }

        // CreateUserModal replacements
        const createModalReplacements = [
            ["alert(data.error || 'Có lỗi xảy ra');", "alert(data.error || t('errorOccurred'));"],
            ["} catch { alert('Có lỗi xảy ra'); }", "} catch { alert(t('errorOccurred')); }"],
            ["<ModalShell title=\"Thêm người dùng\" onClose={onClose}>",
                "<ModalShell title={t('addUserTitle')} onClose={onClose}>"],
            [">Họ tên</label>", ">{t('fullName')}</label>"],
            ["placeholder=\"Nguyễn Văn A\"", "placeholder={t('namePlaceholder')}"],
            [">Số điện thoại</label>", ">{t('phone')}</label>"],
            [">Quyền thật nằm ở Hotel Role bên dưới.</p>", ">{t('roleNote')}</p>"],
            [">Gán vào Hotel</label>", ">{t('assignToHotel')}</label>"],
            [">— Không gán —</option>", ">{t('noAssignment')}</option>"],
            [">Hủy</button>", ">{t('cancel')}</button>"],
            ["{saving ? 'Đang tạo...' : 'Tạo người dùng'}", "{saving ? t('creating') : t('createUser')}"],
        ];
        for (const [target, replacement] of createModalReplacements) {
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                count++;
            }
        }

        // Add t to AssignHotelsModal
        if (!content.match(/function AssignHotelsModal[\s\S]*?const t = useTranslations/)) {
            content = content.replace(
                /function AssignHotelsModal\(\{ user, hotels, onClose, onSaved \}[\s\S]*?\) \{\r?\n    const \[assignments/,
                (match) => {
                    return match.replace(
                        /\) \{\r?\n    const \[assignments/,
                        (m) => m.replace('const [assignments', "const t = useTranslations('admin');\n    const [assignments")
                    );
                }
            );
            count++;
        }

        // AssignHotelsModal replacements
        const assignModalReplacements = [
            ["else alert('Có lỗi xảy ra');", "else alert(t('errorOccurred'));"],
            ["<ModalShell title=\"Gán Hotels\" subtitle={user.email} onClose={onClose}>",
                "<ModalShell title={t('assignHotelsTitle')} subtitle={user.email} onClose={onClose}>"],
            [">Chưa có hotel nào được gán</p>", ">{t('noHotelsAssigned')}</p>"],
            ["+ Thêm hotel", "{t('addHotelAssignment')}"],
            [">Hủy</button>", ">{t('cancel')}</button>"],
            ["{saving ? 'Đang lưu...' : 'Lưu thay đổi'}", "{saving ? t('saving') : t('save')}"],
        ];
        for (const [target, replacement] of assignModalReplacements) {
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                count++;
            }
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ admin/users/page.tsx (modals) — ${count} additional changes`);
            totalReplacements += count;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN HOTELS PAGE
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'app/admin/hotels/page.tsx',
    "import { useTranslations } from 'next-intl';",
    [
        { after: 'export default function AdminHotelsPage() {', text: "const t = useTranslations('admin');" },
    ],
    [
        // STATUS_CONFIG Vietnamese label
        ["CANCELLED: { label: 'Hủy', dot:", "CANCELLED: { label: 'Cancelled', dot:"],
        // deleteHotel
        ["alert('⚠️ Không thể xóa hotel đang có gói hoạt động.\\nVui lòng hủy gói trước khi xóa.');",
            "alert(t('errorOccurred'));"],
        ["if (!confirm(`⚠️ XÓA VĨNH VIỄN hotel \"${hotel.name}\"?\\n\\nHành động này không thể hoàn tác!`)) return;",
            "if (!confirm(t('confirmDeleteHotel', { name: hotel.name }))) return;"],
        ["alert(data.error || 'Có lỗi xảy ra khi xóa');", "alert(data.error || t('errorDeleting'));"],
        // Auth guard
        ["<h1 className=\"text-2xl font-bold text-gray-900\">Không có quyền truy cập</h1>",
            "<h1 className=\"text-2xl font-bold text-gray-900\">{t('noAccess')}</h1>"],
        ["Quay lại Dashboard", "{t('backToDashboard')}"],
        // Header
        [">🏨 Danh sách các khách sạn</h1>", ">{t('hotelsTitle')}</h1>"],
        ["{hotels.length} khách sạn • {hotels.reduce((s, h) => s + h.userCount, 0)} users",
            "{t('hotelsCount', { total: hotels.length, active: hotels.filter(h => h.subscriptionStatus === 'ACTIVE').length })}"],
        [">👥 Quản lý Users", ">{t('usersTitle')}"],
        [">+ Thêm Hotel</button>", ">{t('addHotel')}</button>"],
        // Search
        ["placeholder=\"Tìm theo tên hotel hoặc timezone...\"", "placeholder={t('searchPlaceholder')}"],
        // Filter chips
        ["{ key: 'ALL' as StatusFilter, label: 'Tất cả',", "{ key: 'ALL' as StatusFilter, label: 'All',"],
        ["{ key: 'CANCELLED' as StatusFilter, label: 'Đã hủy',", "{ key: 'CANCELLED' as StatusFilter, label: t('cancelled'),"],
        ["{ key: 'NO_SUB' as StatusFilter, label: 'Chưa có gói',", "{ key: 'NO_SUB' as StatusFilter, label: 'No plan',"],
        [">Tất cả gói</option>", ">All plans</option>"],
        ["⚠️ Vượt limit ({stats.overLimit})", "{t('overSeatLimit')} ({stats.overLimit})"],
        ["⏰ Trial sắp hết ({stats.trialEnding})", "{t('trialEndingSoon')} ({stats.trialEnding})"],
        // Table headers
        [">Gói & Billing</th>", ">Plan & Billing</th>"],
        [">Phòng</th>", ">Rooms</th>"],
        [">Tiền tệ</th>", ">{t('currency')}</th>"],
        [">Quốc gia</th>", ">{t('country')}</th>"],
        [">Thao tác</th>", ">{t('actionsCol')}</th>"],
        // Loading
        [">Đang tải...</td>", ">{t('loading')}</td>"],
        ["? 'Không tìm thấy hotel phù hợp'", "? t('noHotels')"],
        [": 'Chưa có hotel nào'}", ": t('noHotels')}"],
        // Trial ending badge
        [">⏰ Trial sắp hết</div>", ">{t('trialEndingSoon')}</div>"],
        ["<span className=\"text-xs text-gray-400 italic\">Chưa có gói</span>",
            "<span className=\"text-xs text-gray-400 italic\">No plan</span>"],
        [">⚠️ Vượt</span>", ">{t('overSeatLimit')}</span>"],
        // Actions
        ["Sửa\n                                            </button>", "{t('edit')}\n                                            </button>"],
        ["title={!canDelete ? 'Hủy gói trước khi xóa' : 'Xóa hotel'}", "title={!canDelete ? 'Cancel plan first' : t('deleteHotel')}"],
        [">Xóa</button>", ">{t('deleteHotel')}</button>"],
        // Summary stats
        [">Tổng Hotels</div>", ">{t('totalHotels')}</div>"],
        [">Tổng Users</div>", ">{t('users')}</div>"],
        [">Vượt limit</div>", ">{t('overLimit')}</div>"],
    ]
);

// ── HotelModal (add t and replace strings)
{
    const filePath = path.join(webDir, 'app/admin/hotels/page.tsx');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;
        let count = 0;

        // Add t to HotelModal
        if (content.includes('function HotelModal(') && !content.match(/HotelModal[\s\S]*?const t = useTranslations/)) {
            content = content.replace(
                /function HotelModal\(\{[^}]+\}\) \{\r?\n    const \[name/,
                (match) => match.replace('const [name', "const t = useTranslations('admin');\n    const [name")
            );
            count++;
        }

        const hotelModalReplacements = [
            ["{hotel ? 'Chỉnh sửa Hotel' : 'Thêm Hotel mới'}", "{hotel ? t('editHotelTitle') : t('addHotelTitle')}"],
            [">Đang tải thông tin...</div>", ">{t('loading')}</div>"],
            [">Thông tin cơ bản</h3>", ">Basic Info</h3>"],
            [">Tên Hotel *</label>", ">{t('hotelName')} *</label>"],
            [">Số phòng</label>", ">{t('capacity')}</label>"],
            [">Tiền tệ</label>", ">{t('currency')}</label>"],
            [">Quốc gia</label>", ">{t('country')}</label>"],
            [">Giá cơ bản (Base Rate)</h3>", ">Base Rate</h3>"],
            [">Giá cơ bản mặc định ({currency})</label>",
                ">{t('baseRate')} ({currency})</label>"],
            [">Dùng trong Daily Actions để tính giá đề xuất</p>",
                ">Used in Daily Actions for price recommendations</p>"],
            [">Gói dịch vụ</h3>", ">Subscription</h3>"],
            [">Gói (Plan)</label>", ">{t('plan')}</label>"],
            [">— Chưa có gói —</option>", ">— No plan —</option>"],
            [">Trạng thái</label>", ">{t('statusCol')}</label>"],
            [">Đã hủy</option>", ">Cancelled</option>"],
            [">Bắt đầu (From)</label>", ">From</label>"],
            [">Hết hạn (To)</label>", ">To</label>"],
            [">Số users tối đa</label>", ">{t('maxUsers')}</label>"],
            [">⚠️ Chọn gói để kích hoạt subscription cho hotel này</p>",
                ">Select a plan to activate subscription for this hotel</p>"],
            ["Hủy\n                            </button>", "{t('cancel')}\n                            </button>"],
            ["{saving ? 'Đang lưu...' : (hotel ? 'Lưu' : 'Tạo Hotel')}",
                "{saving ? t('saving') : (hotel ? t('save') : t('createHotel'))}"],
            ["alert(data.error || 'Có lỗi xảy ra');", "alert(data.error || t('errorOccurred'));"],
            ["alert('Có lỗi xảy ra');", "alert(t('errorOccurred'));"],
        ];
        for (const [target, replacement] of hotelModalReplacements) {
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                count++;
            }
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ admin/hotels/page.tsx (HotelModal) — ${count} additional changes`);
            totalReplacements += count;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RATE SHOPPER PAGES
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'app/rate-shopper/page.tsx',
    "import { useTranslations } from 'next-intl';",
    [
        { after: 'function RateShopperContent() {', text: "const t = useTranslations('rateShopper');" },
    ],
    [
        // OFFSET_LABELS
        ["7: '+7 ngày',", "7: '+7 days',"],
        ["14: '+14 ngày',", "14: '+14 days',"],
        ["30: '+30 ngày',", "30: '+30 days',"],
        ["60: '+60 ngày',", "60: '+60 days',"],
        ["90: '+90 ngày',", "90: '+90 days',"],
        // STATUS_COLORS labels
        ["FRESH: { bg: '#F0FDF4', text: '#166534', label: 'Mới nhất' },",
            "FRESH: { bg: '#F0FDF4', text: '#166534', label: 'Fresh' },"],
        ["STALE: { bg: '#FFFBEB', text: '#92400E', label: 'Hết hạn' },",
            "STALE: { bg: '#FFFBEB', text: '#92400E', label: 'Stale' },"],
        ["EXPIRED: { bg: '#FEF2F2', text: '#991B1B', label: 'Hết hạn' },",
            "EXPIRED: { bg: '#FEF2F2', text: '#991B1B', label: 'Expired' },"],
        ["REFRESHING: { bg: '#EFF6FF', text: '#1E40AF', label: 'Đang cập nhật' },",
            "REFRESHING: { bg: '#EFF6FF', text: '#1E40AF', label: 'Refreshing' },"],
        ["FAILED: { bg: '#FEF2F2', text: '#991B1B', label: 'Lỗi' },",
            "FAILED: { bg: '#FEF2F2', text: '#991B1B', label: 'Error' },"],
        // CONFIDENCE_BADGES
        ["HIGH: { color: '#16A34A', label: 'Cao' },", "HIGH: { color: '#16A34A', label: 'High' },"],
        ["MED: { color: '#CA8A04', label: 'T.Bình' },", "MED: { color: '#CA8A04', label: 'Medium' },"],
        ["LOW: { color: '#C62828', label: 'Thấp' },", "LOW: { color: '#C62828', label: 'Low' },"],
        // timeAgo helper
        ["if (!isoStr) return 'Chưa có dữ liệu';", "if (!isoStr) return 'No data';"],
        ["if (mins < 1) return 'Vừa xong';", "if (mins < 1) return 'Just now';"],
        ["if (mins < 60) return `${mins} phút trước`;", "if (mins < 60) return `${mins}m ago`;"],
        ["return `${hrs}h trước`;", "return `${hrs}h ago`;"],
        // loadCachedData error
        ["{ status: 'error', message: 'Lỗi tải dữ liệu' }", "{ status: 'error', message: t('errorLoading') }"],
        // handleScan
        ["{ status: 'scanning', message: 'Đang quét giá đối thủ...' }",
            "{ status: 'scanning', message: t('scanning') }"],
        ["message: result.message || 'Hoàn tất',", "message: result.message || t('completed'),"],
        ["message: err instanceof Error ? err.message : 'Lỗi quét giá',",
            "message: err instanceof Error ? err.message : t('errorScanning'),"],
        // Header
        [">So sánh giá đối thủ</h1>", ">{t('pageTitle')}</h1>"],
        [">Rate Shopper • Nhấn &quot;Tìm giá&quot; để quét từng khung thời gian</p>",
            ">{t('pageSubtitle')}</p>"],
        // Sub nav
        ["So sánh giá\n                    </Link>", "{t('compareRates')}\n                    </Link>"],
        ["Quản lý đối thủ\n                    </Link>", "{t('manageCompetitors')}\n                    </Link>"],
        ["Thêm đối thủ\n                    </Link>", "{t('addCompetitor')}\n                    </Link>"],
        // Offset tab status
        ["'Đang quét...'", "t('scanningStatus')"],
        ["'Tải...'", "t('loadingStatus')"],
        ["'Có dữ liệu'", "t('hasData')"],
        ["'Chưa quét'", "t('notScanned')"],
        // Scanning state
        ["{currentState.message || 'Đang quét giá đối thủ...'}", "{currentState.message || t('scanMessage')}"],
        [">Quá trình này có thể mất 10-30 giây</p>", ">{t('scanTime')}</p>"],
        [">Đang tải dữ liệu...</p>", ">{t('loadingData')}</p>"],
        // Scan button
        ["Quét lại giá", "{t('rescanRates')}"],
        ["Cập nhật: {timeAgo(selectedView.cache_fetched_at)}", "{t('updatedAt', { time: timeAgo(selectedView.cache_fetched_at) })}"],
        // Stat cards
        ["label=\"Đối thủ\"", "label={t('competitors')}"],
        ["label=\"Cập nhật\"", "label={t('updated')}"],
        ["value={selectedView.tax_fee_mixed ? 'Hỗn hợp' : 'Đồng nhất'}",
            "value={selectedView.tax_fee_mixed ? t('taxMixed') : t('taxUniform')}"],
        // Table header
        ["Bảng giá đối thủ", "{t('competitorTable')}"],
        // Table th
        ["Đối thủ\n                                        </th>", "{t('competitorCol')}\n                                        </th>"],
        ["Nguồn (OTA)\n                                        </th>", "{t('sourceCol')}\n                                        </th>"],
        ["Giá\n                                        </th>", "{t('priceCol')}\n                                        </th>"],
        ["Trạng thái\n                                        </th>", "{t('statusCol')}\n                                        </th>"],
        ["Tin cậy\n                                        </th>", "{t('confidenceCol')}\n                                        </th>"],
        ["Cập nhật\n                                        </th>", "{t('updatedCol')}\n                                        </th>"],
        // No competitors
        [">Chưa có đối thủ nào</p>", ">{t('noCompetitors')}</p>"],
        ["Thêm đối thủ để bắt đầu so sánh giá", "{t('addToStart')}"],
        ["Thêm đối thủ ngay", "{t('addCompetitorNow')}"],
        // No data state
        ["Chưa có dữ liệu cho {OFFSET_LABELS[selectedOffset]}",
            "{t('noDataForOffset', { offset: OFFSET_LABELS[selectedOffset] })}"],
        ["Nhấn nút bên dưới để quét giá đối thủ", "{t('clickToScan')}"],
        ["Tìm giá {OFFSET_LABELS[selectedOffset]}", "{t('findRates', { offset: OFFSET_LABELS[selectedOffset] })}"],
        [">Mỗi lần quét tiêu 1 credit SerpApi / đối thủ</p>",
            ">1 SerpApi credit per competitor per scan</p>"],
        // Error retry
        [">Thử lại</button>", ">Retry</button>"],
        // CompetitorRow
        [">Không có giá</td>", ">No price</td>"],
        ["? 'Còn phòng'", "? 'Available'"],
        ["? 'Hết phòng'", "? 'Sold out'"],
        [": 'Không có giá';", ": 'No price';"],
    ]
);

// Rate shopper loading
replaceInFile(
    'app/rate-shopper/loading.tsx',
    null,
    null,
    [
        [">Đang tải So sánh giá...</span>", ">Loading Rate Shopper...</span>"],
        ["['+7 ngày', '+14 ngày', '+30 ngày', '+60 ngày', '+90 ngày']",
            "['+7d', '+14d', '+30d', '+60d', '+90d']"],
    ]
);

// ═══════════════════════════════════════════════════════════════
// RATE SHOPPER COMPETITORS PAGE
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'app/rate-shopper/competitors/page.tsx',
    "import { useTranslations } from 'next-intl';",
    [
        { after: 'export default function CompetitorManagementPage() {', text: "const t = useTranslations('rateShopper');" },
    ],
    [
        // These will need to be matched precisely against the actual file
        // Adding common patterns
    ]
);

// ═══════════════════════════════════════════════════════════════
// BILLING COMPONENTS
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'components/billing/BillingCard.tsx',
    "import { useTranslations } from 'next-intl';",
    [{ after: 'export default function BillingCard(', text: '' }],
    [
        [">Gói & Thanh toán</h3>", ">{t('billingTitle')}</h3>"],
        [">Quản lý subscription</p>", ">{t('billingSubtitle')}</p>"],
        ["Trial: còn {data.trialDaysRemaining} ngày", "{t('trialDaysLeft', { n: data.trialDaysRemaining })}"],
        ["label=\"Import / tháng\"", "label={t('importPerMonth')}"],
        ["label=\"Export / ngày\"", "label={t('exportPerDay')}"],
        ["label=\"Người dùng\"", "label={t('usersLabel')}"],
        ["Nâng cấp gói", "{t('upgradePlan')}"],
    ]
);

replaceInFile(
    'components/billing/TrialBanner.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        ["Trial: còn {daysRemaining} ngày", "{t('trialRemaining', { n: daysRemaining })}"],
        [">Bonus +7 ngày:</span>", ">{t('bonusDays')}</span>"],
        ["({conditionsMet}/3 điều kiện)", "{t('conditionsMet', { n: conditionsMet })}"],
        [">Bonus +7 ngày đã được cộng!</span>", ">{t('bonusApplied')}</span>"],
    ]
);

replaceInFile(
    'components/billing/UsageMeter.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        ["Nâng cấp để mở giới hạn →", "{t('upgradeToUnlock')}"],
    ]
);

replaceInFile(
    'components/billing/UpgradeModal.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        ["feature_hard: 'Tính năng này yêu cầu gói cao hơn',", "feature_hard: 'This feature requires a higher plan',"],
        ["feature_soft: 'Bạn có thể xem nhưng không thể sử dụng đầy đủ',", "feature_soft: 'View only — full access requires upgrade',"],
        ["feature_preview: 'Nâng cấp để trải nghiệm đầy đủ',", "feature_preview: 'Upgrade for full experience',"],
        ["quota_exceeded: 'Bạn đã dùng hết quota trong kỳ này',", "quota_exceeded: 'Quota exhausted for this period',"],
        ["feature_locked: 'Tính năng bị khóa ở gói hiện tại',", "feature_locked: 'Feature locked at current plan',"],
        // Feature comparison table
        ["'Import dữ liệu':", "'Data import':"],
        ["'Export bảng giá':", "'Price export':"],
        ["'Xem trước'", "'Preview'"],
        ["'Không giới hạn'", "'Unlimited'"],
        ["'Người dùng':", "'Users':"],
        // Buttons
        ["{variant === 'QUOTA_EXCEEDED' ? 'Đã dùng hết quota' : 'Nâng cấp để mở khóa'}",
            "{variant === 'QUOTA_EXCEEDED' ? 'Quota exhausted' : 'Upgrade to unlock'}"],
        ["Khuyên dùng:", "Recommended:"],
        [">Tính năng</th>", ">Feature</th>"],
        [">Hiện tại</div>", ">Current</div>"],
        ["Để sau", "Skip for now"],
        ["Nâng cấp lên {getPlanLabel(recommendedPlan)}", "Upgrade to {getPlanLabel(recommendedPlan)}"],
    ]
);

replaceInFile(
    'components/billing/PromoRedeemCard.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        ["setMessage(`Giảm ${data.promo.percentOff}% — Nhấn \"Áp dụng\" để kích hoạt`);",
            "setMessage(`Save ${data.promo.percentOff}% — Click Apply to activate`);"],
        ["setMessage(data.error || 'Mã không hợp lệ');", "setMessage(data.error || 'Invalid code');"],
        ["setMessage('Lỗi kết nối. Vui lòng thử lại.');", "setMessage('Connection error. Please try again.');"],
        ["setMessage(`🎉 Đã áp dụng mã ${data.promoCode} — Giảm ${data.percentOff}%`);",
            "setMessage(`🎉 Applied code ${data.promoCode} — Save ${data.percentOff}%`);"],
        ["setMessage(data.error || 'Không thể áp dụng mã');", "setMessage(data.error || 'Cannot apply code');"],
        [">Mã khuyến mãi</span>", ">Promo Code</span>"],
        ["placeholder=\"Nhập mã...\"", 'placeholder="Enter code..."'],
        ["Áp dụng\n", "Apply\n"],
        ["Kiểm tra\n", "Check\n"],
    ]
);

// ═══════════════════════════════════════════════════════════════
// DASHBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════
replaceInFile(
    'components/dashboard/RecommendationTable.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        // Action badges
        ["> Tăng</span>", "> {t('increase')}</span>"],
        ["> Giảm</span>", "> {t('decrease')}</span>"],
        ["> Giữ</span>", "> {t('hold')}</span>"],
        ["> Ngừng bán</span>", "> {t('stopSelling')}</span>"],
        // Time range tabs
        ["{ key: 'today', label: 'Hôm nay' },", "{ key: 'today', label: t('today') },"],
        ["{ key: '7days', label: '7 ngày' },", "{ key: '7days', label: t('days7') },"],
        ["{ key: '14days', label: '14 ngày' },", "{ key: '14days', label: t('days14') },"],
        ["{ key: '30days', label: '30 ngày' },", "{ key: '30days', label: t('days30') },"],
        ["{ key: 'custom', label: 'Tuỳ chọn' },", "{ key: 'custom', label: t('custom') },"],
        // Fallback warning
        [">Ước tính tạm: </span>", ">{t('fallbackEstimate')}</span>"],
        // ADR divergence
        [">ADR lệch lớn: </span>", ">{t('adrDivergence')}</span>"],
        // Performance title
        ["Hiệu suất & Đề xuất giá", "{t('perfAndSuggestions')}"],
        // Date range labels
        [">Từ:</label>", ">{t('fromLabel')}</label>"],
        [">Đến:</label>", ">{t('toLabel')}</label>"],
        // Table headers
        ["\n                                Ngày\n", "\n                                {t('dateCol')}\n"],
        ["\n                                Còn\n", "\n                                {t('remainingCol')}\n"],
        ["\n                                D.Báo\n", "\n                                {t('forecastCol')}\n"],
        ["\n                                Đề xuất\n", "\n                                {t('suggestedCol')}\n"],
        ["\n                                Hành động\n", "\n                                {t('actionCol')}\n"],
        ["\n                                Lý do\n", "\n                                {t('reasonCol')}\n"],
        ["\n                                Thao tác\n", "\n                                {t('operationCol')}\n"],
        // No data
        ["Không có dữ liệu cho khoảng thời gian đã chọn", "{t('noDataForRange')}"],
        // Stop selling
        ["NGỪNG BÁN", "{t('stopSelling')}"],
        // Accept/dismiss
        ["title=\"Chấp nhận\"", "title={t('accept')}"],
        ["title=\"Bỏ qua\"", "title={t('dismiss')}"],
    ]
);

replaceInFile(
    'components/dashboard/LeadTimeBuckets.tsx',
    "import { useTranslations } from 'next-intl';",
    null,
    [
        ["setError('Không tải được dữ liệu');", "setError(t('errorLoadingData'));"],
        ["{error || 'Không có dữ liệu'}", "{error || t('noData')}"],
        [">Thiếu dữ liệu book_time để phân tích lead-time.</p>",
            ">{t('missingBookTime')}</p>"],
    ]
);

// ═══════════════════════════════════════════════════════════════
// MISC PAGES (blocked, unauthorized, etc.)
// ═══════════════════════════════════════════════════════════════

// Payment success/cancel pages
replaceInFile(
    'app/payment/success/page.tsx',
    null, null,
    [
        [">Thanh toán thành công!", ">Payment Successful!"],
        [">Gói dịch vụ của bạn đã được kích hoạt.", ">Your subscription has been activated."],
        [">Về Dashboard</", ">Go to Dashboard</"],
    ]
);

replaceInFile(
    'app/payment/cancel/page.tsx',
    null, null,
    [
        [">Thanh toán bị hủy", ">Payment Cancelled"],
        [">Thanh toán của bạn chưa hoàn tất.", ">Your payment was not completed."],
        [">Thử lại</", ">Try Again</"],
    ]
);

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`🎉 Phase 02 automated replacements complete!`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log('═'.repeat(50));
