import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Users, GraduationCap, BookOpen, Settings, UserPlus, Trash2 } from 'lucide-react';
import UserManagement from '../../components/admin/UserManagement';
import CourseManagement from '../../components/admin/CourseManagement';
import SystemSettings from '../../components/admin/SystemSettings';
import PlatformAnalytics from './PlatformAnalytics';

export default function AdminDashboard() {
    const api = useApi();
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalCourses: 0 });
    const [users, setUsers] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);

    // User Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
    const [newRole, setNewRole] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');

    // Course Modals
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const [showMaterialsModal, setShowMaterialsModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseFormData, setCourseFormData] = useState({ title: '', description: '', category: '', difficulty: '', isPublished: false, teacher: '' });

    const fetchDashboardData = async () => {
        try {
            const [statsRes, usersRes, coursesRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/courses')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setTeachers(usersRes.data.filter(u => u.role === 'teacher'));
            setCourses(coursesRes.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    // -- User Handlers --
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try { await api.post('/admin/users', newUser); setShowAddModal(false); setNewUser({ name: '', email: '', password: '', role: 'student' }); fetchDashboardData(); }
        catch (err) { alert(err.message || 'Error creating user'); }
    };
    const handleChangeRole = async (e) => {
        e.preventDefault();
        try { await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole }); setShowRoleModal(false); setSelectedUser(null); fetchDashboardData(); }
        catch (err) { alert(err.message || 'Error changing role'); }
    };
    const handleAssignStudent = async (e) => {
        e.preventDefault();
        try { await api.post('/admin/assign-student', { studentId: selectedUser._id, teacherId: selectedTeacherId }); setShowAssignModal(false); setSelectedUser(null); alert('Student assigned'); }
        catch (err) { alert(err.message || 'Error assigning student'); }
    };
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.name}?`)) return;
        try { await api.del(`/admin/users/${user._id}`); fetchDashboardData(); }
        catch (err) { alert(err.message || 'Error deleting user'); }
    };

    // -- Course Handlers --
    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try { await api.put(`/admin/courses/${selectedCourse._id}`, courseFormData); setShowEditCourseModal(false); setSelectedCourse(null); fetchDashboardData(); }
        catch (err) { alert(err.message || 'Error updating course'); }
    };
    const handleDeleteCourse = async (course) => {
        if (!window.confirm(`Delete course "${course.title}" and ALL its materials?`)) return;
        try { await api.del(`/admin/courses/${course._id}`); fetchDashboardData(); }
        catch (err) { alert(err.message || 'Error deleting course'); }
    };
    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('Delete this material?')) return;
        try { await api.del(`/admin/materials/${materialId}`); fetchDashboardData(); setShowMaterialsModal(false); }
        catch (err) { alert(err.message || 'Error deleting material'); }
    };

    if (api.loading && users.length === 0) return <Loading />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="text-primary-600" /> Admin Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage platform users, courses, and view statistics</p>
            </div>

            {activeTab !== 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Users size={24} /></div>
                        <div><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{stats.totalStudents}</p></div>
                    </Card>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><GraduationCap size={24} /></div>
                        <div><p className="text-sm text-gray-500">Total Teachers</p><p className="text-2xl font-bold">{stats.totalTeachers}</p></div>
                    </Card>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><BookOpen size={24} /></div>
                        <div><p className="text-sm text-gray-500">Total Courses</p><p className="text-2xl font-bold">{stats.totalCourses}</p></div>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'courses' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Course Management
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Platform Settings
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'analytics' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Platform Analytics
                </button>
            </div>

            {activeTab === 'users' ? (
                <UserManagement
                    users={users} handleDeleteUser={handleDeleteUser} setSelectedUser={setSelectedUser}
                    setNewRole={setNewRole} setShowRoleModal={setShowRoleModal} setShowAssignModal={setShowAssignModal} setShowAddModal={setShowAddModal}
                />
            ) : activeTab === 'courses' ? (
                <CourseManagement
                    courses={courses} handleDeleteCourse={handleDeleteCourse} setSelectedCourse={(c) => { setSelectedCourse(c); setCourseFormData({ title: c.title, description: c.description, category: c.category, difficulty: c.difficulty, isPublished: c.isPublished, teacher: c.teacher?._id || '' }); }}
                    setShowEditCourseModal={setShowEditCourseModal} setShowMaterialsModal={setShowMaterialsModal}
                />
            ) : activeTab === 'analytics' ? (
                <PlatformAnalytics />
            ) : (
                <SystemSettings />
            )}

            {/* User Modals below... */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Name</label><input required type="text" className="input-field" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Email</label><input required type="email" className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Password</label><input required type="password" minLength={6} className="input-field" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Role</label><select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
                            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={api.loading} className="btn-primary">Create User</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Change Role: {selectedUser.name}</h3>
                        <form onSubmit={handleChangeRole} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">New Role</label><select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
                            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowRoleModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={api.loading} className="btn-primary">Update</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Assign to Teacher</h3>
                        <form onSubmit={handleAssignStudent} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Select Teacher</label><select required className="input-field" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}><option value="" disabled>Choose...</option>{teachers.map(t => (<option key={t._id} value={t._id}>{t.name}</option>))}</select></div>
                            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={api.loading} className="btn-primary">Assign</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Course Edit Modal */}
            {showEditCourseModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Edit Course: {selectedCourse.title}</h3>
                        <form onSubmit={handleUpdateCourse} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Title</label><input required type="text" className="input-field" value={courseFormData.title} onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Category</label><input required type="text" className="input-field" value={courseFormData.category} onChange={e => setCourseFormData({ ...courseFormData, category: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Reassign Teacher</label><select className="input-field" value={courseFormData.teacher} onChange={e => setCourseFormData({ ...courseFormData, teacher: e.target.value })}><option value="">Unassigned</option>{teachers.map(t => (<option key={t._id} value={t._id}>{t.name}</option>))}</select></div>
                            <div><label className="block text-sm font-medium mb-1">Status</label><select className="input-field" value={courseFormData.isPublished ? 'published' : 'draft'} onChange={e => setCourseFormData({ ...courseFormData, isPublished: e.target.value === 'published' })}><option value="published">Published</option><option value="draft">Draft</option></select></div>
                            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowEditCourseModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={api.loading} className="btn-primary">Save Changes</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Materials Modal */}
            {showMaterialsModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="text-primary-600" /> Course Materials: {selectedCourse.title}</h3>
                        {selectedCourse.materials?.length === 0 ? (
                            <p className="text-gray-500 py-4 text-center">No materials found for this course.</p>
                        ) : (
                            <div className="space-y-2 mt-4">
                                {selectedCourse.materials?.map(m => (
                                    <div key={m._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">{m.title}</p>
                                            <p className="text-xs text-gray-500 uppercase">{m.type}</p>
                                        </div>
                                        <button onClick={() => handleDeleteMaterial(m._id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setShowMaterialsModal(false)} className="btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
