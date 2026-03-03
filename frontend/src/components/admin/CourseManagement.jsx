import { useState } from 'react';
import Card from '../ui/Card';
import { BookOpen, Edit, Trash2, List } from 'lucide-react';

export default function CourseManagement({
    courses,
    handleDeleteCourse,
    setSelectedCourse,
    setShowEditCourseModal,
    setShowMaterialsModal
}) {
    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Course Management</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-sm">Course Title</th>
                            <th className="px-4 py-3 font-semibold text-sm">Category</th>
                            <th className="px-4 py-3 font-semibold text-sm">Difficulty</th>
                            <th className="px-4 py-3 font-semibold text-sm">Teacher</th>
                            <th className="px-4 py-3 font-semibold text-sm">Materials</th>
                            <th className="px-4 py-3 font-semibold text-sm">Status</th>
                            <th className="px-4 py-3 font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {courses.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm font-medium">{c.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{c.category}</td>
                                <td className="px-4 py-3 text-sm capitalize">{c.difficulty}</td>
                                <td className="px-4 py-3 text-sm">
                                    {c.teacher ? c.teacher.name : <span className="text-red-500">Unassigned</span>}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <button
                                        onClick={() => { setSelectedCourse(c); setShowMaterialsModal(true); }}
                                        className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
                                    >
                                        <List size={14} /> {c.materials?.length || 0} items
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {c.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm flex gap-2">
                                    <button
                                        onClick={() => { setSelectedCourse(c); setShowEditCourseModal(true); }}
                                        className="text-gray-500 hover:text-primary-600 p-1" title="Edit Course"
                                    ><Edit size={16} /></button>
                                    <button
                                        onClick={() => handleDeleteCourse(c)}
                                        className="text-red-500 hover:text-red-700 p-1" title="Delete Course"
                                    ><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {courses.length === 0 && <div className="text-center py-8 text-gray-500">No courses found</div>}
            </div>
        </Card>
    );
}
