import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_ORG = { id: 'org-1', name: 'VoltFlow Demo',  splitRate: 0.05 };

const MOCK_TEAM = [
    { id: 'u1', name: 'Host Owner',   email: 'owner@voltflow.io',    role: 'OWNER' },
    { id: 'u2', name: 'Ana Operadora', email: 'ana@voltflow.io',     role: 'OPERATOR' },
    { id: 'u3', name: 'Carlos Tech',  email: 'carlos@voltflow.io',   role: 'VIEWER' },
];

const MOCK_CHARGERS = [
    { id: 'cp1', ocppId: 'CP-SAO-001', status: 'AVAILABLE',   hasPassword: true  },
    { id: 'cp2', ocppId: 'CP-SAO-002', status: 'CHARGING',    hasPassword: true  },
    { id: 'cp3', ocppId: 'CP-RIO-001', status: 'UNAVAILABLE', hasPassword: false },
];

function generatePassword(len = 16): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Modal component ──────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-surface-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none transition-colors">✕</button>
            </div>
            {children}
        </div>
    </div>
);

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
    OWNER:    'text-lime-400 bg-lime-400/10',
    OPERATOR: 'text-sky-400 bg-sky-400/10',
    VIEWER:   'text-slate-300 bg-slate-700',
};

export const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'org' | 'team' | 'chargers'>('org');

    // ── Org state ──
    const [org, setOrg]       = useState(MOCK_ORG);
    const [orgDraft, setOrgDraft] = useState(MOCK_ORG);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // ── Team state ──
    const [team, setTeam]           = useState(MOCK_TEAM);
    const [inviteModal, setInviteModal] = useState(false);
    const [inviteName, setInviteName]   = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole]   = useState<'OPERATOR' | 'VIEWER'>('OPERATOR');
    const [inviting, setInviting]       = useState(false);

    // ── Charger state ──
    const [chargers, setChargers]     = useState(MOCK_CHARGERS);
    const [pwModal, setPwModal]       = useState<typeof MOCK_CHARGERS[0] | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [copied, setCopied]           = useState(false);

    // Try to load real data — silently fall back to mock
    useEffect(() => {
        api.settings.getOrganization().then(d => { if (d) { setOrg(d); setOrgDraft(d); }}).catch(() => {});
        api.settings.getTeam().then(d       => { if (d?.length) setTeam(d); }).catch(() => {});
        api.settings.getChargers().then(d   => { if (d?.length) setChargers(d); }).catch(() => {});
    }, []);

    // ── Org save ──────────────────────────────────────────────────────────────
    const handleOrgSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMsg('');
        try {
            await api.settings.updateOrganization({ name: orgDraft.name, splitRate: orgDraft.splitRate });
            setOrg(orgDraft);
            setSaveMsg('✅ Configurações salvas com sucesso!');
        } catch {
            // Backend offline — apply locally anyway
            setOrg(orgDraft);
            setSaveMsg('✅ Alterações aplicadas localmente.');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(''), 3000);
        }
    };

    // ── Invite submit ─────────────────────────────────────────────────────────
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !inviteName) return;
        setInviting(true);
        await new Promise(r => setTimeout(r, 800));
        setTeam(prev => [...prev, {
            id: `u${Date.now()}`,
            name: inviteName,
            email: inviteEmail,
            role: inviteRole,
        }]);
        setInviting(false);
        setInviteModal(false);
        setInviteName(''); setInviteEmail('');
    };

    // ── Reset password ────────────────────────────────────────────────────────
    const openPwModal = (cp: typeof MOCK_CHARGERS[0]) => {
        setNewPassword(generatePassword());
        setCopied(false);
        setPwModal(cp);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSavePassword = async () => {
        if (!pwModal) return;
        await new Promise(r => setTimeout(r, 600));
        setChargers(prev => prev.map(c => c.id === pwModal.id ? { ...c, hasPassword: true } : c));
        setPwModal(null);
    };

    const tabs = [
        { key: 'org' as const,      label: t('settings.tabs.org') },
        { key: 'team' as const,     label: t('settings.tabs.team') },
        { key: 'chargers' as const, label: t('settings.tabs.chargers') },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
                <p className="text-slate-400 text-sm mt-1">{t('settings.subtitle')}</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-4 border-b border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            activeTab === tab.key
                                ? 'border-volt-400 text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Organization tab ─────────────────────────────────────────── */}
            {activeTab === 'org' && (
                <form onSubmit={handleOrgSave} className="card-glass p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-white">{t('settings.org.title')}</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {t('settings.org.nameLabel')}
                        </label>
                        <input
                            type="text"
                            value={orgDraft.name}
                            onChange={e => setOrgDraft({ ...orgDraft, name: e.target.value })}
                            className="w-full bg-surface-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-volt-400 focus:outline-none focus:ring-1 focus:ring-volt-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {t('settings.org.splitRateLabel')}: <span className="text-volt-400 font-bold">{(orgDraft.splitRate * 100).toFixed(1)}%</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-3">{t('settings.org.splitRateHint')}</p>
                        <input
                            type="range" min="0" max="0.5" step="0.01"
                            value={orgDraft.splitRate}
                            onChange={e => setOrgDraft({ ...orgDraft, splitRate: parseFloat(e.target.value) })}
                            className="w-full accent-volt-400 cursor-pointer h-2"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0%</span><span>25%</span><span>50%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-volt-500 hover:bg-volt-400 text-black font-semibold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? '⏳ ' + t('settings.org.saving') : t('settings.org.save')}
                        </button>
                        {saveMsg && <span className="text-sm text-lime-400 animate-fade-in">{saveMsg}</span>}
                    </div>
                </form>
            )}

            {/* ── Team tab ────────────────────────────────────────────────── */}
            {activeTab === 'team' && (
                <>
                    <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">{t('settings.team.title')}</h2>
                            <button
                                onClick={() => setInviteModal(true)}
                                className="bg-volt-500 hover:bg-volt-400 text-black text-sm font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                            >
                                ＋ {t('settings.team.invite')}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {team.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-surface-900 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-volt-500/20 border border-volt-500/30 flex items-center justify-center">
                                            <span className="text-volt-400 font-bold text-sm">{member.name[0]}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{member.name}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[member.role] ?? ROLE_COLORS['VIEWER']}`}>
                                        {member.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invite modal */}
                    {inviteModal && (
                        <Modal title="Convidar Usuário" onClose={() => setInviteModal(false)}>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                                    <input
                                        required
                                        value={inviteName}
                                        onChange={e => setInviteName(e.target.value)}
                                        placeholder="Ex: João Silva"
                                        className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-volt-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                                    <input
                                        required type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="joao@empresa.com"
                                        className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-volt-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Papel</label>
                                    <select
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value as 'OPERATOR' | 'VIEWER')}
                                        className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-volt-400 focus:outline-none"
                                    >
                                        <option value="OPERATOR">OPERATOR — Pode iniciar/parar sessões</option>
                                        <option value="VIEWER">VIEWER — Apenas visualização</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setInviteModal(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-1 bg-volt-500 hover:bg-volt-400 text-black text-sm font-semibold py-2 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {inviting ? 'Convidando...' : '✉️ Enviar convite'}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}
                </>
            )}

            {/* ── Chargers tab ─────────────────────────────────────────────── */}
            {activeTab === 'chargers' && (
                <>
                    <div className="card-glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">{t('settings.chargers.title')}</h2>
                        <p className="text-sm text-slate-400 mb-6">{t('settings.chargers.description')}</p>
                        <div className="space-y-3">
                            {chargers.map(cp => (
                                <div key={cp.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-surface-900 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                                            ⚡
                                        </div>
                                        <div>
                                            <p className="font-mono text-white tracking-wider text-sm">{cp.ocppId}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {t('settings.chargers.status')}: <span className="text-slate-300">{cp.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cp.hasPassword ? 'text-lime-400 bg-lime-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                            {cp.hasPassword ? '🔒 ' + t('settings.chargers.passwordSet') : '⚠️ ' + t('settings.chargers.noPassword')}
                                        </span>
                                        <button
                                            onClick={() => openPwModal(cp)}
                                            className="text-volt-400 hover:text-volt-300 text-sm font-medium hover:underline transition-colors"
                                        >
                                            {t('settings.chargers.resetPassword')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reset password modal */}
                    {pwModal && (
                        <Modal title={`Redefinir senha — ${pwModal.ocppId}`} onClose={() => setPwModal(null)}>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400">
                                    Uma nova senha foi gerada para este carregador. Copie e configure no hardware antes de fechar.
                                </p>
                                <div className="bg-surface-900 border border-slate-700 rounded-xl p-4">
                                    <p className="text-xs text-slate-500 mb-2 font-medium">NOVA SENHA OCPP</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <code className="text-volt-400 font-mono text-sm tracking-wider break-all">{newPassword}</code>
                                        <button
                                            onClick={handleCopy}
                                            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-lime-500/20 text-lime-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                        >
                                            {copied ? '✓ Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                                    <p className="text-xs text-amber-400">
                                        ⚠️ Esta senha só é exibida uma vez. Configure no carregador físico antes de salvar.
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => { setNewPassword(generatePassword()); setCopied(false); }}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2 rounded-xl transition-all"
                                    >
                                        🔄 Gerar outra
                                    </button>
                                    <button
                                        onClick={handleSavePassword}
                                        className="flex-1 bg-volt-500 hover:bg-volt-400 text-black text-sm font-semibold py-2 rounded-xl transition-all"
                                    >
                                        ✅ Salvar senha
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
};
