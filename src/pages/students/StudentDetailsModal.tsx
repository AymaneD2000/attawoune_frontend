import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Student } from '../../types';

interface StudentDetailModalProps {
    student: Student;
    onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'info' | 'enrollments' | 'grades' | 'attendance' | 'bulletins' | 'finance' | 'idcard'>('info');
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

    const toggleYear = (year: string) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [grades, setGrades] = useState<any>({ exam_grades: { results: [] }, course_grades: { results: [] } });
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [reportCards, setReportCards] = useState<any[]>([]);
    const [financialStatement, setFinancialStatement] = useState<any>(null);
    const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!student?.id) return;
        setLoading(true);
        try {
            if (activeTab === 'enrollments') {
                const res = await api.get(`/students/${student.id}/enrollments/`);
                setEnrollments(res.data.results || []);
            } else if (activeTab === 'grades') {
                const res = await api.get(`/students/${student.id}/grades/`);
                setGrades(res.data);
            } else if (activeTab === 'attendance') {
                const res = await api.get(`/students/${student.id}/attendance_stats/`);
                setAttendanceStats(res.data);
            } else if (activeTab === 'bulletins') {
                const res = await api.get('/academics/report-cards/', {
                    params: { student: student.id }
                });
                setReportCards(res.data.results || []);
            } else if (activeTab === 'finance') {
                const res = await api.get('/finance/student-balances/statement/', {
                    params: { student_id: student.id }
                });
                setFinancialStatement(res.data);
            } else if (activeTab === 'idcard') {
                // Use imported studentService if available, otherwise direct api call. 
                // Since I cannot easily add import here without checking if it exists, I'll use direct API for now or partial import.
                // Actually StudentDetailsModal doesn't import studentService yet. I should use api.
                const response = await api.get(`/students/${student.id}/generate_id_card/`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                setIdCardUrl(url);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [student?.id, activeTab]);

    useEffect(() => {
        if (activeTab !== 'info') {
            fetchData();
        }
    }, [activeTab, fetchData]);

    const downloadReportCard = async (id: number) => {
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1'}/academics/report-cards/${id}/download_pdf/`, '_blank');
    };

    const downloadStatement = async () => {
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1'}/finance/student-balances/download_statement/?student_id=${student.id}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {student.user_full_name?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{student.user_full_name}</h2>
                                <p className="text-white/80">{student.student_id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex overflow-x-auto">
                        {(['info', 'enrollments', 'grades', 'attendance', 'bulletins', 'finance', 'idcard'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {{
                                    info: t('students.details.tabs.info', 'Informations'),
                                    enrollments: t('students.details.tabs.enrollments', 'Inscriptions'),
                                    grades: t('students.details.tabs.grades', 'Notes'),
                                    attendance: t('students.details.tabs.attendance', 'Présence'),
                                    bulletins: t('students.details.tabs.bulletins', 'Bulletins'),
                                    finance: t('students.details.tabs.finance', 'Finances'),
                                    idcard: t('students.details.tabs.idcard', "Carte d'étudiant")
                                }[tab]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoCard label={t('students.details.info.program', 'Programme')} value={student.program_name || 'N/A'} />
                                    <InfoCard label={t('students.details.info.level', 'Niveau')} value={student.level_display || 'N/A'} />
                                    <InfoCard label={t('students.details.info.status', 'Statut')} value={student.status || 'N/A'} />
                                    <InfoCard label={t('students.details.info.enrollment_date', "Date d'inscription")} value={student.enrollment_date || 'N/A'} />
                                </div>
                            )}

                            {activeTab === 'enrollments' && (
                                <div className="space-y-4">
                                    {enrollments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">{t('students.details.enrollments.empty', 'Aucune inscription trouvée')}</p>
                                    ) : (
                                        enrollments.map((enrollment: any, index: number) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="font-semibold">{enrollment.program_name}</p>
                                                        <p className="text-sm text-gray-500">{enrollment.academic_year_name}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm ${enrollment.status === 'ENROLLED' ? 'bg-green-100 text-green-800' :
                                                        enrollment.status === 'PROMOTED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'grades' && (
                                <div className="space-y-4">
                                    {grades.exam_grades?.results?.length ? (() => {
                                        // Group grades by academic year then semester
                                        const grouped: Record<string, Record<string, any[]>> = {};
                                        grades.exam_grades.results.forEach((grade: any) => {
                                            const year = grade.academic_year_name || t('students.details.grades.undefined', 'Non défini');
                                            const sem = grade.semester_name || t('students.details.grades.undefined', 'Non défini');
                                            if (!grouped[year]) grouped[year] = {};
                                            if (!grouped[year][sem]) grouped[year][sem] = [];
                                            grouped[year][sem].push(grade);
                                        });

                                        return Object.entries(grouped).map(([yearName, semesters]) => (
                                            <div key={yearName} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleYear(`grade-${yearName}`)}
                                                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                                                            📅
                                                        </div>
                                                        <span className="font-bold text-gray-900 text-lg">{yearName}</span>
                                                    </div>
                                                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedYears[`grade-${yearName}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {(expandedYears[`grade-${yearName}`] !== false) && (
                                                    <div className="p-4 space-y-4">
                                                        {Object.entries(semesters).map(([semName, semGrades]) => (
                                                            <div key={semName}>
                                                                <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                                    {semName}
                                                                </h4>
                                                                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                                    <table className="w-full text-left">
                                                                        <thead className="bg-gray-50">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('students.details.grades.course', 'Cours')}</th>
                                                                                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('students.details.grades.type', 'Type')}</th>
                                                                                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">{t('students.details.grades.grade', 'Note')}</th>
                                                                                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('students.details.grades.date', 'Date')}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-50">
                                                                            {(semGrades as any[]).map((grade: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                                                    <td className="px-4 py-3">
                                                                                        <p className="font-medium text-gray-800">{grade.course_name}</p>
                                                                                        <p className="text-xs text-gray-400">{grade.course_code}</p>
                                                                                    </td>
                                                                                    <td className="px-4 py-3">
                                                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                                                            {grade.exam_type_display}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-center">
                                                                                        <span className={`text-lg font-bold ${grade.is_absent ? 'text-orange-500' : parseFloat(grade.score) >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                                                                                            {grade.is_absent ? 'ABS' : `${grade.score}/20`}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                                                        {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString() : '-'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })() : (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-gray-500">{t('students.details.grades.empty', "Aucune note d'examen trouvée")}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'attendance' && attendanceStats && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatBox label={t('students.details.attendance.total', 'Total Sessions')} value={attendanceStats.statistics?.total_sessions || 0} color="gray" />
                                        <StatBox label={t('students.details.attendance.present', 'Présent')} value={attendanceStats.statistics?.present || 0} color="green" />
                                        <StatBox label={t('students.details.attendance.absent', 'Absent')} value={attendanceStats.statistics?.absent || 0} color="red" />
                                        <StatBox label={t('students.details.attendance.late', 'En retard')} value={attendanceStats.statistics?.late || 0} color="yellow" />
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                                        <p className="text-white/80">{t('students.details.attendance.rate', 'Taux de présence')}</p>
                                        <p className="text-4xl font-bold">{attendanceStats.statistics?.attendance_rate || 0}%</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bulletins' && (
                                <div className="space-y-4">
                                    {reportCards.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-gray-500 mb-2">{t('students.details.bulletins.empty', 'Aucun bulletin disponible')}</p>
                                            <button className="text-indigo-600 hover:underline font-medium" onClick={fetchData}>{t('students.details.bulletins.refresh', 'Actualiser')}</button>
                                        </div>
                                    ) : (() => {
                                        // Group report cards by academic year
                                        const groupedByYear: Record<string, any[]> = {};
                                        reportCards.forEach((rc: any) => {
                                            const year = rc.academic_year || t('students.details.grades.undefined', 'Non défini');
                                            if (!groupedByYear[year]) groupedByYear[year] = [];
                                            groupedByYear[year].push(rc);
                                        });

                                        return Object.entries(groupedByYear).map(([yearName, cards]) => (
                                            <div key={yearName} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleYear(`bulletin-${yearName}`)}
                                                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                                                            🎓
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="font-bold text-gray-900 text-lg">{yearName}</span>
                                                            <p className="text-sm text-gray-500">{cards.length} {t('students.details.bulletins.bulletin', 'bulletin')}{cards.length > 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedYears[`bulletin-${yearName}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {(expandedYears[`bulletin-${yearName}`] !== false) && (
                                                    <div className="p-4 space-y-3">
                                                        {cards.map((rc: any, idx: number) => (
                                                            <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <h4 className="font-bold text-gray-900">{rc.semester_name}</h4>
                                                                        {rc.is_published && (
                                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('students.details.bulletins.published', 'Publié')}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm">
                                                                        <span className="text-gray-600">{t('students.details.bulletins.average', 'Moyenne')}: <span className={`font-bold ${parseFloat(rc.gpa) >= 10 ? 'text-green-600' : 'text-red-500'}`}>{rc.gpa}/20</span></span>
                                                                        {rc.total_credits && <span className="text-gray-400">{t('students.details.bulletins.credits', 'Crédits')}: {rc.credits_earned}/{rc.total_credits}</span>}
                                                                        {rc.rank && <span className="text-gray-400">{t('students.details.bulletins.rank', 'Rang')}: {rc.rank}</span>}
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mt-1">{t('students.details.bulletins.generated_at', 'Généré le')}: {new Date(rc.generated_at).toLocaleDateString()}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => downloadReportCard(rc.id)}
                                                                    className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0"
                                                                    title="Télécharger PDF"
                                                                >
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}

                            {activeTab === 'finance' && financialStatement && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <StatBox label={t('students.details.finance.total_due', 'Total Dû')} value={financialStatement.total_due} color="gray" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <StatBox label={t('students.details.finance.total_paid', 'Total Payé')} value={financialStatement.total_paid} color="green" />
                                            <StatBox label={t('students.details.finance.remaining', 'Reste à Payer')} value={financialStatement.balance} color={financialStatement.balance > 0 ? "red" : "green"} />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg">{t('students.details.finance.history', 'Historique des transactions')}</h3>
                                            <button
                                                onClick={downloadStatement}
                                                className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {t('students.details.finance.download_statement', 'Télécharger Relevé')}
                                            </button>
                                        </div>

                                        {financialStatement.transactions && financialStatement.transactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {financialStatement.transactions.map((trans: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {trans.payment_method}
                                                                <span className="text-gray-400 text-xs ml-2">#{trans.transaction_id || '-'}</span>
                                                            </p>
                                                            <p className="text-xs text-gray-500">{new Date(trans.date).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className="font-bold font-mono">{parseFloat(trans.amount).toLocaleString()} FCFA</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">{t('students.details.finance.empty', 'Aucune transaction')}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'idcard' && (
                                <div className="space-y-6 flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-gray-900">{t('students.details.idcard.title', "Carte d'Étudiant")}</h3>
                                    {idCardUrl ? (
                                        <>
                                            <div className="shadow-lg rounded-xl overflow-hidden border border-gray-200">
                                                <img src={idCardUrl} alt="Carte d'étudiant" className="max-w-md w-full h-auto" />
                                            </div>
                                            <a
                                                href={idCardUrl}
                                                download={`carte_etudiant_${student.student_id}.png`}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md transition-all hover:scale-105"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {t('students.details.idcard.download', 'Télécharger la carte')}
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-gray-500">{t('students.details.idcard.loading', 'Chargement de la carte...')}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
    </div>
);

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-800',
        green: 'bg-emerald-100 text-emerald-800',
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-amber-100 text-amber-800',
    };
    return (
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

export default StudentDetailModal;
