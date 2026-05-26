import { useEffect, useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import { PlusCircle, TicketPercent, Ban, Pencil, RotateCcw, Clock3 } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const initialForm = {
  code: '',
  title: '',
  description: '',
  courseId: '',
  discountType: 'percent',
  discountValue: 10,
  maxDiscount: 0,
  minOrderAmount: 0,
  maxUses: 0,
  perUserLimit: 1,
  expiresAt: '',
};

export default function EducatorCoupons() {
  usePageTitle('Coupons');
  const api = useApi();
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const fetchCoupons = async () => {
    const res = await api.get('/payments/coupons');
    setCoupons(res.data || []);
  };

  const fetchCourses = async () => {
    const res = await api.get('/courses/teaching');
    setCourses(res.data || []);
  };

  useEffect(() => {
    fetchCoupons().catch(() => {});
    fetchCourses().catch(() => {});
  }, []);

  const activeCoupons = useMemo(() => coupons.filter((c) => c.isActive), [coupons]);
  const inactiveCoupons = useMemo(() => coupons.filter((c) => !c.isActive), [coupons]);

  const toDatetimeLocal = (d) => {
    if (!d) return '';
    const date = new Date(d);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/payments/coupons', {
        ...form,
        code: form.code.toUpperCase(),
        applicableCourses: [form.courseId],
      });
      setForm(initialForm);
      setShowForm(false);
      setMessage('Coupon created');
      await fetchCoupons();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const deactivate = async (id) => {
    setMessage('');
    try {
      await api.patch(`/payments/coupons/${id}/deactivate`);
      setMessage('Coupon deactivated');
      await fetchCoupons();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to deactivate coupon');
    }
  };

  const reactivate = async (id) => {
    setMessage('');
    try {
      await api.patch(`/payments/coupons/${id}/reactivate`);
      setMessage('Coupon reactivated');
      await fetchCoupons();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reactivate coupon');
    }
  };

  const startEdit = (coupon) => {
    setEditing(coupon);
    setEditForm({
      title: coupon.title || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percent',
      discountValue: coupon.discountValue ?? 0,
      maxDiscount: coupon.maxDiscount ?? 0,
      minOrderAmount: coupon.minOrderAmount ?? 0,
      maxUses: coupon.maxUses ?? 0,
      perUserLimit: coupon.perUserLimit ?? 1,
      expiresAt: toDatetimeLocal(coupon.expiresAt),
      courseId: String(coupon.applicableCourses?.[0]?._id || coupon.applicableCourses?.[0] || ''),
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing || !editForm) return;
    setMessage('');
    try {
      await api.patch(`/payments/coupons/${editing._id}`, {
        ...editForm,
        discountValue: Number(editForm.discountValue),
        maxDiscount: Number(editForm.maxDiscount),
        minOrderAmount: Number(editForm.minOrderAmount),
        maxUses: Number(editForm.maxUses),
        perUserLimit: Number(editForm.perUserLimit),
        applicableCourses: [editForm.courseId],
      });
      setEditing(null);
      setEditForm(null);
      setMessage('Coupon updated');
      await fetchCoupons();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update coupon');
    }
  };

  if (api.loading && coupons.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TicketPercent className="text-primary-600" />
          Coupon Management
        </h1>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setShowForm((v) => !v)}>
          <PlusCircle size={16} />
          {showForm ? 'Close' : 'New Coupon'}
        </button>
      </div>

      {message && <div className="card !p-3 text-sm">{message}</div>}

      {/* ═══ Create Coupon Form (clean & labeled) ═══ */}
      {showForm && (
        <form onSubmit={createCoupon} className="card space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Create New Coupon</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Each coupon is linked to one course. A code cannot be used on any other course.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              required
            >
              <option value="">Select course for this coupon</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">This coupon will only work for the selected course.</p>
          </div>

          {/* Code & Title */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field font-mono uppercase tracking-wider"
                placeholder="e.g. FEST20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Students will enter this code at checkout</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Coupon Title
              </label>
              <input
                className="input-field"
                placeholder="e.g. Festive Season Sale"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          {/* Discount Type & Value */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  type="number"
                  min="1"
                  placeholder={form.discountType === 'percent' ? 'e.g. 20' : 'e.g. 100'}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  {form.discountType === 'percent' ? '%' : '₹'}
                </span>
              </div>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Expires On <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field sm:max-w-xs"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              required
            />
          </div>

          {/* Advanced Settings (collapsed by default) */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 select-none py-1">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced Settings
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </summary>
            <div className="mt-3 pl-6 space-y-4 border-l-2 border-gray-100 dark:border-gray-700">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Discount Cap (₹)</label>
                  <input className="input-field" type="number" min="0" placeholder="0 = no cap"
                    value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} />
                  <p className="text-[11px] text-gray-400 mt-1">For percentage coupons. 0 = no limit.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Order Amount (₹)</label>
                  <input className="input-field" type="number" min="0" placeholder="0 = no minimum"
                    value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Usage Limit</label>
                  <input className="input-field" type="number" min="0" placeholder="0 = unlimited"
                    value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
                  <p className="text-[11px] text-gray-400 mt-1">How many times this coupon can be used total.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Per Student Limit</label>
                  <input className="input-field" type="number" min="1"
                    value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })} />
                  <p className="text-[11px] text-gray-400 mt-1">Max times each student can use this.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea className="input-field" rows={2} placeholder="e.g. Special festive discount for all courses"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </details>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary flex items-center gap-2" type="submit">
              <TicketPercent size={16} />
              Create Coupon
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ═══ Active Coupons ═══ */}
      {activeCoupons.length > 0 && (
        <div>
          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Active coupons
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCoupons.map((c) => (
              <div key={c._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-lg">{c.code}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    active
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{c.title || 'Untitled coupon'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Course: <span className="font-medium">{c.applicableCourses?.[0]?.title || 'Not linked'}</span>
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {c.discountType === 'percent'
                    ? `${c.discountValue}% OFF`
                    : `Rs ${c.discountValue} OFF`} • used {c.usedCount} times
                </p>
                <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                  <Clock3 size={14} /> Expires: {new Date(c.expiresAt).toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => startEdit(c)}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => deactivate(c._id)}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-red-600">
                    <Ban size={14} /> Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Inactive Coupons ═══ */}
      {inactiveCoupons.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Inactive coupons
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveCoupons.map((c) => (
              <div key={c._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-lg">{c.code}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    inactive
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{c.title || 'Untitled coupon'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Course: <span className="font-medium">{c.applicableCourses?.[0]?.title || 'Not linked'}</span>
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {c.discountType === 'percent'
                    ? `${c.discountValue}% OFF`
                    : `Rs ${c.discountValue} OFF`} • used {c.usedCount} times
                </p>
                <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                  <Clock3 size={14} /> Expires: {new Date(c.expiresAt).toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => startEdit(c)}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => reactivate(c._id)}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-emerald-700">
                    <RotateCcw size={14} /> Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coupons.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-10">
          No coupons found yet. Create your first festival offer or educator discount.
        </div>
      )}

      {/* ═══ Edit Modal ═══ */}
      {editing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Coupon: {editing.code}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Update discount rules and expiry.
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Course
                </label>
                <select
                  className="input-field"
                  value={editForm.courseId}
                  onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                  required
                >
                  <option value="">Select course for this coupon</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Title" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                <select className="input-field" value={editForm.discountType}
                  onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <textarea className="input-field" rows={2} placeholder="Description (optional)" value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="number" min="0" placeholder="Discount value" value={editForm.discountValue}
                  onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value === '' ? 0 : Number(e.target.value) })} required />
                <input className="input-field" type="number" min="0" placeholder="Max discount (optional)" value={editForm.maxDiscount}
                  onChange={(e) => setEditForm({ ...editForm, maxDiscount: e.target.value === '' ? 0 : Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="number" min="0" placeholder="Min order amount" value={editForm.minOrderAmount}
                  onChange={(e) => setEditForm({ ...editForm, minOrderAmount: e.target.value === '' ? 0 : Number(e.target.value) })} />
                <input className="input-field" type="number" min="1" placeholder="Per user limit" value={editForm.perUserLimit}
                  onChange={(e) => setEditForm({ ...editForm, perUserLimit: e.target.value === '' ? 1 : Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="number" min="0" placeholder="Total usage limit (0 unlimited)" value={editForm.maxUses}
                  onChange={(e) => setEditForm({ ...editForm, maxUses: e.target.value === '' ? 0 : Number(e.target.value) })} />
                <input className="input-field" type="datetime-local" value={editForm.expiresAt}
                  onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })} required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
