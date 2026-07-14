import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AcademicCapIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import universityService from '../../services/universityService';
import userService from '../../services/userService';
import studentService from '../../services/studentService';
import { Program, Level, Student, User } from '../../types';
import { normalizeApiError } from '../../utils/apiError';

interface StudentFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    student?: Student | null;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ onClose, onSuccess, student }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        role: 'STUDENT' as const,
        phone: '',
        address: '',
        date_of_birth: '',
        gender: 'M'
    });

    const [studentData, setStudentData] = useState({
        program: student?.program ? String(student.program) : '',
        current_level: student?.current_level ? String(student.current_level) : '',
        enrollment_date: student?.enrollment_date || new Date().toISOString().split('T')[0],
        status: student?.status || 'ACTIVE',
        guardian_name: student?.guardian_name || '',
        guardian_phone: student?.guardian_phone || '',
        emergency_contact: student?.emergency_contact || ''
    });

    const [photo, setPhoto] = useState<File | null>(null);

    // Options
    const [programs, setPrograms] = useState<Program[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [programsRes, levelsRes] = await Promise.all([
                    universityService.getPrograms({ page_size: 100 }),
                    universityService.getLevels({ page_size: 100 })
                ]);
                setPrograms(programsRes.results);
                setLevels(levelsRes.results);
            } catch (err) {
                console.error('Error fetching options:', err);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (student) {
            const populateForm = async () => {
                try {
                    // Check if student.user is an ID or object (handling potential type mismatch from API)
                    const userId = typeof student.user === 'object' ? (student.user as any).id : student.user;

                    let user: User | null = null;
                    if (userId) {
                        // If we already have the user object in student (if serializer nested it), use it.
                        if (typeof student.user === 'object' && (student.user as any).email) {
                            user = student.user as any;
                        } else {
                            user = await userService.getUser(userId);
                        }
                    }

                    if (user) {
                        setUserData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            username: user.username || '',
                            role: 'STUDENT' as const,
                            phone: user.phone || '',
                            address: user.address || '',
                            date_of_birth: user.date_of_birth || '',
                            gender: 'M' // Default
                        });
                    }

                    setStudentData({
                        program: student.program ? String(student.program) : '',
                        current_level: student.current_level ? String(student.current_level) : '',
                        enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
                        status: student.status || 'ACTIVE',
                        guardian_name: student.guardian_name || '',
                        guardian_phone: student.guardian_phone || '',
                        emergency_contact: student.emergency_contact || ''
                    });

                } catch (error) {
                    console.error("Failed to populate form:", error);
                }
            };
            populateForm();
        }
    }, [student]);

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setStudentData({ ...studentData, [e.target.name]: e.target.value });
    };

    const validateStep1 = (): boolean => {
        if (!userData.first_name || !userData.last_name) {
            setError(t('students.form.errors.required_fields', 'Veuillez remplir tous les champs obligatoires'));
            return false;
        }
        setError(null);
        return true;
    };

    const goToNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const goToPreviousStep = () => {
        setStep(1);
    };

    const handleFinalSubmit = async () => {
        // This function is ONLY called from step 2
        setError(null);
        setLoading(true);

        try {
            let userId = student?.user;

            // Auto-generate username from first_name + last_name + random number
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const autoUsername = `etu_${userData.first_name.toLowerCase().replace(/\s/g, '_')}_${userData.last_name.toLowerCase().replace(/\s/g, '_')}_${randomNum}`;

            if (!student) {
                // Create User if not editing
                const birthYear = userData.date_of_birth ? new Date(userData.date_of_birth).getFullYear() : new Date().getFullYear();
                const generatedPassword = `${userData.first_name}${userData.last_name}@${birthYear}`.replace(/\s/g, '');

                const userPayload: any = {
                    ...userData,
                    username: autoUsername,
                    password: generatedPassword,
                    password_confirm: generatedPassword
                };

                if (!userPayload.email) delete userPayload.email;
                if (!userPayload.date_of_birth) delete userPayload.date_of_birth;
                if (!userPayload.phone) delete userPayload.phone;
                if (!userPayload.address) delete userPayload.address;

                const userResponse = await userService.createUser(userPayload);
                userId = userResponse.id;
            } else {
                // Update User if editing (optional, usually user details are separate but basic info can be here)
                // For now we skip specific user update endpoint call here to keep it simple or we can call it if needed.
                // Assuming we might want to update basic info.
                // HOWEVER, usually creating student implies creating user.
                // Let's assume for update we focus on student fields mostly, but maybe we can update user info too?
                // Let's try to update user info first if editing.
                if (userId) {
                    await userService.updateUser(userId, userData);
                }
            }

            // Create/Update Student
            const studentPayload = new FormData();
            if (!student) {
                studentPayload.append('user', String(userId));
            }
            studentPayload.append('program', studentData.program);
            studentPayload.append('current_level', studentData.current_level);
            // Default status to ACTIVE but make sure it uses the enum value
            studentPayload.append('status', String(studentData.status || 'ACTIVE'));
            studentPayload.append('enrollment_date', studentData.enrollment_date);
            if (studentData.guardian_name) studentPayload.append('guardian_name', studentData.guardian_name);
            if (studentData.guardian_phone) studentPayload.append('guardian_phone', studentData.guardian_phone);
            if (studentData.emergency_contact) studentPayload.append('emergency_contact', studentData.emergency_contact);

            if (photo) {
                studentPayload.append('photo', photo);
            }

            if (student) {
                await studentService.updateStudent(student.id, studentPayload);
            } else {
                await studentService.createStudent(studentPayload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving student:', err);
            setError(normalizeApiError(
                err.response?.data,
                t('students.form.errors.save_error', 'Erreur lors de la sauvegarde'),
            ).message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('students.form.sections.user_info', 'Informations Utilisateur')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.first_name', 'Prénom')} *</label>
                    <input
                        type="text"
                        name="first_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.first_name}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.last_name', 'Nom')} *</label>
                    <input
                        type="text"
                        name="last_name"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.last_name}
                        onChange={handleUserChange}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.email', 'Email')}</label>
                <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={userData.email}
                    onChange={handleUserChange}
                />
            </div>

            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> {student ? t('students.form.notes.password_admin') : t('students.form.notes.password_auto')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.date_of_birth', 'Date de naissance')}</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.date_of_birth}
                        onChange={handleUserChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.gender', 'Sexe')}</label>
                    <select
                        name="gender"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={userData.gender}
                        onChange={handleUserChange}
                    >
                        <option value="M">{t('admin.users.gender.M', 'Homme')}</option>
                        <option value="F">{t('admin.users.gender.F', 'Femme')}</option>
                    </select>
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.photo', 'Photo de profil')}</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setPhoto(e.target.files[0]);
                        }
                    }}
                    className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                />
            </div>
        </div >
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('students.form.sections.academic_info', 'Informations Académiques')}</h3>
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span className="font-semibold">Note:</span> {t('students.form.notes.matricule_auto')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.program', 'Programme')} *</label>
                    <select
                        name="program"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={studentData.program}
                        onChange={handleStudentChange}
                    >
                        <option value="">{t('students.form.placeholders.select', 'Sélectionner')}</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.level', 'Niveau')} *</label>
                    <select
                        name="current_level"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={studentData.current_level}
                        onChange={handleStudentChange}
                        disabled={!studentData.program}
                    >
                        <option value="">{t('students.form.placeholders.select', 'Sélectionner')}</option>
                        {levels
                            .filter(l => {
                                if (!studentData.program) return false;
                                const selectedProg = programs.find(p => p.id === parseInt(studentData.program));
                                return selectedProg?.levels.includes(l.id);
                            })
                            .map(l => (
                                <option key={l.id} value={l.id}>{l.display_name}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.enrollment_date', "Date d'inscription")}</label>
                <input
                    type="date"
                    name="enrollment_date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={studentData.enrollment_date}
                    onChange={handleStudentChange}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.form.labels.guardian_name', 'Nom du tuteur')}</label>
                <input
                    type="text"
                    name="guardian_name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={studentData.guardian_name}
                    onChange={handleStudentChange}
                />
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-form-title"
                className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[90dvh]"
            >
                <header className="relative shrink-0 overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-green-500 px-5 py-5 text-white sm:px-6">
                    <div className="absolute bottom-0 start-0 h-1 w-full bg-gradient-to-r from-blue-500 via-orange-400 to-orange-600" />
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                                {step === 1 ? <UserIcon className="h-6 w-6" /> : <AcademicCapIcon className="h-6 w-6" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-200">
                                    {student ? t('students.form.edit_eyebrow', 'Mise à jour du dossier') : t('students.form.new_eyebrow', 'Nouvelle inscription')}
                                </p>
                                <h2 id="student-form-title" className="mt-1 truncate text-xl font-black">
                                    {student ? t('students.form.title_edit', 'Modifier Étudiant') : t('students.form.title_new', 'Nouvel Étudiant')}
                                </h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                            aria-label={t('common.close', 'Fermer')}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
                    <div className="mx-auto flex max-w-md items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</span>
                            <span className={`truncate text-sm font-black ${step === 1 ? 'text-blue-700' : 'text-slate-500'}`}>
                                {t('students.form.steps.identity', 'Identité')}
                            </span>
                        </div>
                        <div className={`mx-3 h-1 flex-1 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                            <span className={`truncate text-sm font-black ${step === 2 ? 'text-green-700' : 'text-slate-400'}`}>
                                {t('students.form.steps.academic', 'Scolarité')}
                            </span>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                        </div>
                    </div>
                </div>

                <div data-testid="student-form-scroll-body" className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                            {error}
                        </div>
                    )}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        {step === 1 ? renderStep1() : renderStep2()}
                    </div>
                </div>

                <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                    {step === 2 ? (
                        <button type="button" onClick={goToPreviousStep} disabled={loading} className="brand-button-secondary">
                            {t('students.form.buttons.prev', 'Précédent')}
                        </button>
                    ) : <span />}

                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={goToNextStep}
                            className="brand-button ms-auto"
                            disabled={!userData.first_name || !userData.last_name}
                        >
                            {t('students.form.buttons.next', 'Suivant')}
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinalSubmit} disabled={loading} className="brand-button ms-auto">
                            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                            {student ? t('students.form.buttons.update', 'Enregistrer') : t('students.form.buttons.create', "Créer l'étudiant")}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default StudentFormModal;
