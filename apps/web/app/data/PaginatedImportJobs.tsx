'use client';

import { useState, useEffect } from 'react';
import { DateUtils } from '../../lib/date';

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

export function PaginatedImportJobs({ initialJobs, totalCount }: PaginatedImportJobsProps) {
    const [jobs, setJobs] = useState<ImportJob[]>(initialJobs);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

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
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-50">📁 Import Jobs</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Tổng: {totalCount}</span>
                </div>
            </div>

            <div className={`overflow-x-auto ${loading ? 'opacity-50' : ''}`}>
                <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-slate-400">#</th>
                            <th className="px-4 py-2 text-left text-slate-400">File</th>
                            <th className="px-4 py-2 text-left text-slate-400">Status</th>
                            <th className="px-4 py-2 text-left text-slate-400">Created</th>
                            <th className="px-4 py-2 text-left text-slate-400">Finished</th>
                            <th className="px-4 py-2 text-left text-slate-400">Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job, idx) => (
                            <tr key={job.job_id} className="border-t border-slate-800 hover:bg-slate-800/30">
                                <td className="px-4 py-2 text-slate-500 text-xs">
                                    {(page - 1) * PAGE_SIZE + idx + 1}
                                </td>
                                <td className="px-4 py-2 text-slate-300 font-mono text-xs max-w-[200px] truncate" title={job.file_name || 'N/A'}>
                                    {job.file_name || 'N/A'}
                                </td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                            job.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-slate-400 text-xs">
                                    {DateUtils.format(job.created_at, 'dd/MM HH:mm')}
                                </td>
                                <td className="px-4 py-2 text-slate-400 text-xs">
                                    {job.finished_at ? DateUtils.format(job.finished_at, 'dd/MM HH:mm') : '-'}
                                </td>
                                <td className="px-4 py-2 text-rose-400 text-xs max-w-xs truncate" title={job.error_summary || ''}>
                                    {job.error_summary || '-'}
                                </td>
                            </tr>
                        ))}
                        {jobs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                    Chưa có import job nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={page <= 1 || loading}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Trước
                    </button>
                    <span className="text-sm text-slate-400">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={page >= totalPages || loading}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Sau →
                    </button>
                </div>
            )}
        </div>
    );
}
