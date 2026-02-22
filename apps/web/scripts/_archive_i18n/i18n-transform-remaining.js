// Transform JSX in /data, /settings, /settings/team, /rate-shopper
const fs = require('fs');
const path = require('path');

function transform(file, replacements) {
    const fp = path.join(__dirname, '..', file);
    let code = fs.readFileSync(fp, 'utf8');
    let count = 0;
    for (const [from, to] of replacements) {
        if (code.includes(from)) {
            code = code.replace(from, to);
            count++;
        } else {
            console.log(`⚠️ [${file}] NOT FOUND: ${from.substring(0, 60)}...`);
        }
    }
    fs.writeFileSync(fp, code, 'utf8');
    console.log(`✅ ${file}: ${count}/${replacements.length} done`);
}

// ── /data/page.tsx ──────────────────────────────
transform('app/data/page.tsx', [
    [`title="Data Inspector"`, `title={t('pageTitle')}`],
    [`label: 'Reservations',`, `label: t('badgeReservations'),`],
    [`label: 'Import Jobs',`, `label: t('badgeImportJobs'),`],
    [`label: 'OTB Days',`, `label: t('badgeOtbDays'),`],
    [`>Import Jobs</div>`, `>{t('importJobsLabel')}</div>`],
    [`>OTB Days</div>`, `>{t('otbDaysLabel')}</div>`],
    [`>Data Range</div>`, `>{t('dataRangeLabel')}</div>`],
    [`>Room-nights</div>`, `>{t('roomNights')}</div>`],
    [`📈 Daily OTB (On The Books)`, `📈 {t('dailyOtbTitle')}`],
]);

// ── /settings/page.tsx ──────────────────────────
transform('app/settings/page.tsx', [
    [`>Pricing Ladder</label>`, `>{t('pricingLadder')}</label>`],
    [`>Band</p>`, `>{t('bandLabel')}</p>`],
    [`>Organization</p>`, `>{t('organizationLabel')}</p>`],
    [`label="Imports (monthly)"`, `label={t('quotaImports')}`],
    [`label="Exports (daily)"`, `label={t('quotaExports')}`],
    [`label="Rate Shops (monthly)"`, `label={t('quotaRateShops')}`],
    [`>Max Users</span>`, `>{t('maxUsersLabel')}</span>`],
    [`Trial {subData.trialDaysRemaining}d`, `{t('trialBadge', { days: subData.trialDaysRemaining })}`],
    [`unit="per day"`, `unit={t('perDay')}`],
]);

// ── /settings/team/page.tsx (full i18n) ─────────
const teamFile = 'app/settings/team/page.tsx';
const tfp = path.join(__dirname, '..', teamFile);
let teamCode = fs.readFileSync(tfp, 'utf8');

// Add import
teamCode = teamCode.replace(
    "import { Users, Ticket, AlertTriangle, Trash2, Clock, XCircle, ChevronDown, Shield, ShieldCheck, Eye } from 'lucide-react'",
    "import { Users, Ticket, AlertTriangle, Trash2, Clock, XCircle, ChevronDown, Shield, ShieldCheck, Eye } from 'lucide-react'\nimport { useTranslations } from 'next-intl'"
);

// Add hook
teamCode = teamCode.replace(
    'const { data: session } = useSession()',
    'const { data: session } = useSession()\n    const t = useTranslations(\'teamPage\')'
);

const teamReplacements = [
    // Header
    [`{orgInfo ? \`Members • \${orgInfo.orgName}\` : 'Team Management'}`, `{orgInfo ? t('titleWithOrg', { org: orgInfo.orgName }) : t('title')}`],
    [`>Invite members and manage access</p>`, `>{t('subtitle')}</p>`],
    // Invite section
    [`> Invite Member</h2>`, `> {t('inviteTitle')}</h2>`],
    [`}/{seats.max >= 999 ? '∞' : seats.max} members`, `}/{seats.max >= 999 ? '∞' : seats.max} {t('members')}`],
    [`(+{seats.pendingInvites} invite)`, `({t('inviteCount', { n: seats.pendingInvites })})`],
    // Limit warning
    [`> Limit reached members for plan`, `> {t('limitWarning')}`],
    [`>User quota limited by plan (tier), not by rooms (band).</p>`, `>{t('limitNote')}</p>`],
    [`>Upgrade plan for more members →</a>`, `>{t('upgradeLink')}</a>`],
    // Invite code display
    [`>Invite code (role: {ROLE_LABELS[invite.role] || invite.role}):</p>`, `>{t('inviteCodeLabel', { role: ROLE_LABELS[invite.role] || invite.role })}:</p>`],
    [`>Or share link:</p>`, `>{t('shareLabel')}</p>`],
    [`{copied ? '✓ Copied' : 'Copy'}`, `{copied ? t('copied') : t('copy')}`],
    [`Expires: {formatDate(invite.expiresAt)}`, `{t('expires', { date: formatDate(invite.expiresAt) })}`],
    [`Create another invite`, `{t('createAnother')}`],
    // Role picker
    [`>👁 Viewer</option>`, `>{t('viewer')}</option>`],
    [`>🔧 Manager</option>`, `>{t('manager')}</option>`],
    // Create button
    [`{inviteLoading ? 'Creating...' : atLimit ? 'Limit reached' : '+ Create new invite code'}`, `{inviteLoading ? t('creating') : atLimit ? t('limitReached') : t('createInvite')}`],
    [`title={atLimit ? 'Limit reached members' : ''}`, `title={atLimit ? t('limitReached') : ''}`],
    // Active invites
    [`> Active invite codes ({activeInvites.length})`, `> {t('activeInvites', { n: activeInvites.length })}`],
    [`>Used: {inv.used_count}/{inv.max_uses}</span>`, `>{t('usedCount', { used: inv.used_count, max: inv.max_uses })}</span>`],
    [`<span className="text-red-500">Expired</span>`, `<span className="text-red-500">{t('expired')}</span>`],
    [`title="Revoke invite code"`, `title={t('revokeTitle')}`],
    // Members list
    [`> Members ({members.length})</h2>`, `> {t('membersTitle', { n: members.length })}</h2>`],
    [`>Loading...</div>`, `>{t('loading')}</div>`],
    [`>No members yet</div>`, `>{t('noMembers')}</div>`],
    [`{member.user.name || 'Unnamed'}`, `{member.user.name || t('unnamed')}`],
    [`>(you)</span>`, `>{t('you')}</span>`],
    // Role badge
    [`>Owner</span>`, `>{t('owner')}</span>`],
    // Confirm/Cancel
    [`{removing === member.id ? '...' : 'Confirm'}`, `{removing === member.id ? '...' : t('confirm')}`],
    [`Cancel\n`, `{t('cancel')}\n`],
    [`title="Remove Member"`, `title={t('removeMemberTitle')}`],
    // Messages
    [`setSuccess(\`Role changed to \${ROLE_LABELS[newRole] || newRole}\`)`, `setSuccess(t('roleChanged', { role: ROLE_LABELS[newRole] || newRole }))`],
    [`setSuccess('Member removed')`, `setSuccess(t('memberRemoved'))`],
    [`setError(data.message || 'Limit reached members for the current plan.')`, `setError(data.message || t('limitReachedError'))`],
    [`setError(data.error || 'Cannot create invite code')`, `setError(data.error || t('cannotCreate'))`],
    [`setError('An error occurred')`, `setError(t('errorOccurred'))`],
    [`setError(data.error || 'Cannot change role')`, `setError(data.error || t('cannotChangeRole'))`],
    [`setError(data.error || 'Cannot remove member')`, `setError(data.error || t('cannotRemove'))`],
];

let tCount = 0;
for (const [from, to] of teamReplacements) {
    if (teamCode.includes(from)) {
        teamCode = teamCode.replace(from, to);
        tCount++;
    } else {
        console.log(`⚠️ [team] NOT FOUND: ${from.substring(0, 60)}...`);
    }
}
fs.writeFileSync(tfp, teamCode, 'utf8');
console.log(`✅ ${teamFile}: ${tCount}/${teamReplacements.length} done`);

// ── /rate-shopper/page.tsx ──────────────────────
const rateFile = 'app/rate-shopper/page.tsx';
const rfp = path.join(__dirname, '..', rateFile);
let rateCode = fs.readFileSync(rfp, 'utf8');

// Need to pass t to CompetitorRow - add prop
// First, let the RateShopperContent pass t as prop
rateCode = rateCode.replace(
    `<CompetitorRow\n                                                key={comp.competitor_id}\n                                                comp={comp}\n                                                myRate={selectedView.my_rate}\n                                                isEven={idx % 2 === 0}\n                                            />`,
    `<CompetitorRow\n                                                key={comp.competitor_id}\n                                                comp={comp}\n                                                myRate={selectedView.my_rate}\n                                                isEven={idx % 2 === 0}\n                                                t={t}\n                                            />`
);

// Update CompetitorRow to accept t prop
rateCode = rateCode.replace(
    `function CompetitorRow({\n    comp,\n    myRate,\n    isEven,\n}: {\n    comp: IntradayCompetitor;\n    myRate: number | null;\n    isEven: boolean;\n})`,
    `function CompetitorRow({\n    comp,\n    myRate,\n    isEven,\n    t,\n}: {\n    comp: IntradayCompetitor;\n    myRate: number | null;\n    isEven: boolean;\n    t: ReturnType<typeof useTranslations>;\n})`
);

// Nav links (254, 261, 271)
const rateReplacements = [
    [`Price Comparison\n                    </Link>`, `{t('navPriceComparison')}\n                    </Link>`],
    [`Manage Competitors\n                    </Link>`, `{t('navManageCompetitors')}\n                    </Link>`],
    [`Add Competitor\n                    </Link>`, `{t('navAddCompetitor')}\n                    </Link>`],
    // Table headers
    [`Competitors\n                                        </th>`, `{t('thCompetitors')}\n                                        </th>`],
    [`Source (OTA)\n                                        </th>`, `{t('thSource')}\n                                        </th>`],
    [`Price\n                                        </th>`, `{t('thPrice')}\n                                        </th>`],
    [`Status\n                                        </th>`, `{t('thStatus')}\n                                        </th>`],
    [`Reliability\n                                        </th>`, `{t('thReliability')}\n                                        </th>`],
    [`Update\n                                        </th>`, `{t('thUpdate')}\n                                        </th>`],
    // No price / Low (placeholder row)
    [`>No price</td>`, `>{t('noPrice')}</td>`],
    [`>Low</span>`, `>{t('lowConfidence')}</span>`],
    // Availability labels
    [`? 'Available'\n                        : rate.availability_status === 'SOLD_OUT'\n                            ? 'Sold out'\n                            : 'No price'`, `? t('available')\n                        : rate.availability_status === 'SOLD_OUT'\n                            ? t('soldOut')\n                            : t('noPrice')`],
    // Official badge
    [`>Official</span>`, `>{t('official')}</span>`],
    // Price sources
    [`{rates.length} price sources`, `{t('priceSources', { n: rates.length })}`],
    // Retry
    [`>Retry\n                    </button>`, `>{t('retry')}\n                    </button>`],
    // SerpApi note
    [`Each scan uses 1 SerpApi credit / competitor`, `{t('serpApiNote')}`],
    // Check-in label
    [`label="Check-in"`, `label={t('thCheckIn') || 'Check-in'}`],
    // Tax/Fee label  
    [`label="Tax/Fee"`, `label={t('thTaxFee') || 'Tax/Fee'}`],
];

let rCount = 0;
for (const [from, to] of rateReplacements) {
    if (rateCode.includes(from)) {
        rateCode = rateCode.replace(from, to);
        rCount++;
    } else {
        console.log(`⚠️ [rate] NOT FOUND: ${from.substring(0, 60)}...`);
    }
}

// Also update timeAgo to use translations - but it's a standalone function
// For now, leave it as-is since it's a utility function with locale-specific formatting

fs.writeFileSync(rfp, rateCode, 'utf8');
console.log(`✅ ${rateFile}: ${rCount}/${rateReplacements.length} done`);
