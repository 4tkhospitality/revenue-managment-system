'use client';

import { useState } from 'react';
import { DateUtils } from '../../lib/date';
import { useTranslations } from 'next-intl';

interface ImportJob {
    job_id: string;
    file_name: string | null;
    status: string;
    created_at: Date;
    finished_at: Date | null;
    error_summary: string | null;
}

interface PaginatedImportJobsProps {
    initialJobs: ImportJob[];
    totalCount: number;
}

const PAGE_SIZE = 10;

// Surface styling - consistent with other components
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200";

export function PaginatedImportJobs({ initialJobs, totalCount }: PaginatedImportJobsProps) {
    const t = useTranslations('dataPage');
    const [jobs, setJobs] = useState<ImportJob[]>(initialJobs);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const fetchPage = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/import-jobs?page=${pageNum}&pageSize=${PAGE_SIZE}`);
            const data = await res.json();
            setJobs(data.jobs.map((j: any) => ({
                ...j,
                created_at: new Date(j.created_at),
                finished_at: j.finished_at ? new Date(j.finished_at) : null,
            })));
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch import jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        if (page > 1) fetchPage(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) fetchPage(page + 1);
    };

    return (
        <div className={`${surface} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">📁 Import Jobs</h2>
                    <span className="text-sm text-gray-500">{t('total', { n: totalCount })}</span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                    {isExpanded ? (
                        <>
                            <span>▲</span>
                            <span>{t('collapse')}</span>
                        </>
                    ) : (
                        <>
                            <span>▼</span>
                            <span>{t('expand')}</span>
                        </>
                    )}
                </button>
            </div>

            {isExpanded && (
                <>
                    <div className={`overflow-x-auto ${loading ? 'opacity-50' : ''}`}>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">#</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">File</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Created</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Finished</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job, idx) => (
                                    <tr key={job.job_id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-400 text-xs">
                                            {(page - 1) * PAGE_SIZE + idx + 1}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 font-mono text-xs max-w-[200px] truncate" title={job.file_name || 'N/A'}>
                                            {job.file_name || 'N/A'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                job.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">
                                            {DateUtils.format(job.created_at, 'dd/MM HH:mm')}
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">
                                            {job.finished_at ? DateUtils.format(job.finished_at, 'dd/MM HH:mm') : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-rose-600 text-xs max-w-xs truncate" title={job.error_summary || ''}>
                                            {job.error_summary || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                            {t('noImportJobs')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={handlePrev}
                                disabled={page <= 1 || loading}
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ← {t('prev').replace('← ', '')}
                            </button>
                            <span className="text-sm text-gray-500">
                                {t('pageOf', { p: page, t: totalPages })}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={page >= totalPages || loading}
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
