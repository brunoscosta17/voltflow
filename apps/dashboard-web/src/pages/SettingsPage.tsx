import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'org' | 'team' | 'chargers'>('org');

    const [org, setOrg] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [chargers, setChargers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.settings.getOrganization().then(setOrg).catch(console.error);
        api.settings.getTeam().then(setTeam).catch(console.error);
        api.settings.getChargers().then(setChargers).catch(console.error);
    }, []);

    const handleOrgSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await api.settings.updateOrganization({
                name: org.name,
                splitRate: parseFloat(org.splitRate),
            });
            setOrg(updated);
            alert('Settings saved successfully!');
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your organization, team members, and hardware credentials.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800">
                {(['org', 'team', 'chargers'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 capitalize ${activeTab === tab ? 'border-volt-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        {tab === 'org' ? 'Organization' : tab}
                    </button>
                ))}
            </div>

            {/* Organization Tab */}
            {activeTab === 'org' && org && (
                <form onSubmit={handleOrgSave} className="card-glass p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-white">Organization Settings</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name</label>
                        <input
                            type="text"
                            value={org.name}
                            onChange={(e) => setOrg({ ...org, name: e.target.value })}
                            className="w-full bg-surface-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-volt-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            VoltFlow Platform Split Rate: {(org.splitRate * 100).toFixed(1)}%
                        </label>
                        <p className="text-xs text-slate-500 mb-3">This is the percentage VoltFlow deducts from each successful charging session.</p>
                        <input
                            type="range"
                            min="0"
                            max="0.5"
                            step="0.01"
                            value={org.splitRate}
                            onChange={(e) => setOrg({ ...org, splitRate: e.target.value })}
                            className="w-full accent-volt-400 cursor-pointer"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-volt-500 hover:bg-volt-400 text-black font-semibold py-2 px-6 rounded-xl transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <div className="card-glass p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Team Members</h2>
                        <button className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all">
                            Invite User
                        </button>
                    </div>
                    <div className="space-y-4">
                        {team.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-surface-900">
                                <div>
                                    <p className="font-medium text-white">{member.name}</p>
                                    <p className="text-sm text-slate-400">{member.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded bg-slate-800 font-semibold ${member.role === 'OWNER' ? 'text-lime-400' : 'text-slate-300'}`}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chargers Auth Tab */}
            {activeTab === 'chargers' && (
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Hardware Authentication</h2>
                    <p className="text-sm text-slate-400 mb-6">Manage the Basic Auth passwords used by your physical chargers to connect to the VoltFlow OCPP WebSocket.</p>

                    <div className="space-y-4">
                        {chargers.map(cp => (
                            <div key={cp.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-surface-900">
                                <div>
                                    <p className="font-mono text-white tracking-wider">{cp.ocppId}</p>
                                    <p className="text-xs text-slate-500 mt-1">Status: {cp.status}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-xs font-semibold ${cp.hasPassword ? 'text-lime-400' : 'text-red-400'}`}>
                                        {cp.hasPassword ? '✅ Password Set' : '⚠️ No Password'}
                                    </span>
                                    <button className="text-volt-400 text-sm hover:underline font-medium">Reset Password</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
