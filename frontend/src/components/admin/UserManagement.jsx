import { Users, GraduationCap, BookOpen, UserPlus, Trash2, Edit } from 'lucide-react';
import Card from '../ui/Card';

export default function UserManagement({
    users,
    handleDeleteUser,
    setSelectedUser,
    setNewRole,
    setShowRoleModal,
    setShowAssignModal,
    setShowAddModal
}) {
    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">User Management</h2>
                <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
                    <UserPlus size={18} /> Add User
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-sm">Name</th>
                            <th className="px-4 py-3 font-semibold text-sm">Email</th>
                            <th className="px-4 py-3 font-semibold text-sm">Role</th>
                            <th className="px-4 py-3 font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={'px-2 py-1 rounded-full text-xs font-bold ' +
                                        (u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                            u.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700')}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm flex gap-2">
                                    <button
                                        onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}
                                        className="text-gray-500 hover:text-primary-600 p-1" title="Change Role"
                                    ><Edit size={16} /></button>
                                    {u.role === 'student' && (
                                        <button
                                            onClick={() => { setSelectedUser(u); setShowAssignModal(true); }}
                                            className="text-gray-500 hover:text-green-600 p-1" title="Assign to Teacher"
                                        ><UserPlus size={16} /></button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="text-red-500 hover:text-red-700 p-1" title="Delete User"
                                    ><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && <div className="text-center py-8 text-gray-500">No users found</div>}
            </div>
        </Card>
    );
}
