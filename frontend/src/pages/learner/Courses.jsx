import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import {
  Search, BookOpen, Users, IndianRupee, CreditCard,
  Tag, X, CheckCircle, AlertCircle, Sparkles, TicketPercent,
} from 'lucide-react';

function formatINR(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Courses() {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [paying, setPaying] = useState(null);
  const [feeMap, setFeeMap] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [couponInputMap, setCouponInputMap] = useState({});
  const [appliedCouponMap, setAppliedCouponMap] = useState({});
  const [originalFeeMap, setOriginalFeeMap] = useState({});
  const [couponMsgMap, setCouponMsgMap] = useState({});
  usePageTitle('Courses');

  /* ─── Helpers ─── */
  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const showCouponMsg = (courseId, text, type = 'info') => {
    setCouponMsgMap((prev) => ({ ...prev, [courseId]: { text, type } }));
    setTimeout(() => {
      setCouponMsgMap((prev) => {
        const next = { ...prev };
        if (next[courseId]?.text === text) delete next[courseId];
        return next;
      });
    }, 4000);
  };

  /* ─── Data Loading ─── */
  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data || []));
  }, []);

  useEffect(() => {
    const loadRazorpayScript = () =>
      new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    const paidCourseIds = courses.filter((c) => c.price > 0).map((c) => c._id);
    if (!paidCourseIds.length) return;
    (async () => {
      const nextFeeMap = {};
      for (const id of paidCourseIds) {
        try {
          const res = await api.get(`/payments/fees/${id}`);
          nextFeeMap[id] = res.data;
        } catch (e) {
          nextFeeMap[id] = null;
        }
      }
      setFeeMap(nextFeeMap);
      setOriginalFeeMap(nextFeeMap);
    })();
  }, [courses]);

  /* ─── Actions ─── */
  const enroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post('/courses/' + courseId + '/enroll');
      await refreshUser();
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setEnrolling(null);
  };

  const applyCouponPreview = async (courseId) => {
    if (appliedCouponMap[courseId]) {
      showCouponMsg(courseId, 'Only one coupon can be applied per purchase. Remove the current coupon first.', 'error');
      return;
    }
    const code = (couponInputMap[courseId] || '').trim();
    if (!code) {
      showCouponMsg(courseId, 'Please enter a coupon code first.', 'error');
      return;
    }
    try {
      const res = await api.get(`/payments/coupons/validate?courseId=${courseId}&code=${encodeURIComponent(code)}`);
      const breakdown = res.data?.breakdown;
      const couponInfo = res.data?.coupon;
      if (breakdown) {
        if (!originalFeeMap[courseId]) {
          setOriginalFeeMap((prev) => ({ ...prev, [courseId]: feeMap[courseId] }));
        }
        setFeeMap((prev) => ({ ...prev, [courseId]: breakdown }));
      }
      setAppliedCouponMap((prev) => ({
        ...prev,
        [courseId]: {
          code: couponInfo?.code || code.toUpperCase(),
          discountType: couponInfo?.discountType,
          discountValue: couponInfo?.discountValue,
          discount: breakdown?.discount || 0,
        },
      }));
      showCouponMsg(courseId, `Coupon "${couponInfo?.code || code}" applied successfully!`, 'success');
    } catch (e) {
      showCouponMsg(courseId, e.response?.data?.message || 'Invalid or expired coupon.', 'error');
    }
  };

  const removeCoupon = (courseId) => {
    if (originalFeeMap[courseId]) {
      setFeeMap((prev) => ({ ...prev, [courseId]: originalFeeMap[courseId] }));
    }
    setAppliedCouponMap((prev) => { const n = { ...prev }; delete n[courseId]; return n; });
    setCouponInputMap((prev) => ({ ...prev, [courseId]: '' }));
    showCouponMsg(courseId, 'Coupon removed.', 'info');
  };

  const payForCourse = async (course) => {
    setMessage('');
    setPaying(course._id);
    try {
      if (!window.Razorpay) throw new Error('Razorpay checkout script not loaded');
      const appliedCoupon = appliedCouponMap[course._id];
      const orderRes = await api.post('/payments/create-order', {
        courseId: course._id,
        couponCode: appliedCoupon?.code || '',
      });
      const orderData = orderRes.data;
      if (orderData.directEnrolled) {
        await refreshUser();
        setCourses((await api.get('/courses')).data || []);
        showMessage('Coupon applied — enrolled with zero payment!', 'success');
        setAppliedCouponMap((p) => { const n = { ...p }; delete n[course._id]; return n; });
        setCouponInputMap((p) => ({ ...p, [course._id]: '' }));
        setPaying(null);
        return;
      }
      const rz = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(Number(orderData.amount || 0) * 100),
        currency: orderData.currency || 'INR',
        name: 'Personalized Learning Platform',
        description: `Purchase: ${orderData.courseName || course.title}`,
        order_id: orderData.orderId,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await refreshUser();
            setCourses((await api.get('/courses')).data || []);
            showMessage('Payment successful! You are now enrolled.', 'success');
            setAppliedCouponMap((p) => { const n = { ...p }; delete n[course._id]; return n; });
            setCouponInputMap((p) => ({ ...p, [course._id]: '' }));
          } catch (err) {
            showMessage(err.response?.data?.message || 'Payment verification failed.', 'error');
          } finally { setPaying(null); }
        },
        modal: { ondismiss: () => { setPaying(null); showMessage('Payment cancelled.', 'info'); } },
      });
      rz.on('payment.failed', (r) => { showMessage(r?.error?.description || 'Payment failed.', 'error'); setPaying(null); });
      rz.open();
    } catch (e) {
      showMessage(e.response?.data?.message || e.message || 'Could not initiate payment.', 'error');
      setPaying(null);
    }
  };

  /* ─── Derived ─── */
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  const getEffectiveTotal = (courseId, fallback) => feeMap[courseId]?.totalAmount ?? fallback;

  if (api.loading && courses.length === 0) return <Loading />;

  /* ─── Render ─── */
  return (
    <div className="space-y-6 page-transition">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-violet-500 dark:from-primary-400 dark:to-violet-400 bg-clip-text text-transparent">
            Explore Courses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            id="course-search"
            className="input-field pl-10 !py-2.5 !text-sm !rounded-xl"
            placeholder="Search by title or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Global Message Banner ── */}
      {message && (
        <div
          className={`animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            messageType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : messageType === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
          }`}
        >
          {messageType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="flex-1">{message}</span>
          <button onClick={() => setMessage('')} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Course Grid ── */}
      {filtered.length === 0 ? (
        <EmptyState title="No courses found" icon={BookOpen} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 stagger-children">
          {filtered.map((course) => {
            const userId = user?.id || user?._id;
            const enrolled = course.learners?.some((s) => (typeof s === 'string' ? s : s._id) === userId);
            const appliedCoupon = appliedCouponMap[course._id];
            const fees = feeMap[course._id];
            const couponMsg = couponMsgMap[course._id];

            return (
              <div
                key={course._id}
                className="group relative bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60
                           shadow-sm hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-400/5
                           transition-all duration-300 ease-smooth overflow-hidden flex flex-col"
              >
                {/* ── Thumbnail ── */}
                <div className="relative h-36 sm:h-40 bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 dark:from-primary-600 dark:via-violet-600 dark:to-purple-700 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
                  <BookOpen size={36} className="text-white/70 group-hover:scale-110 transition-transform duration-300" />
                  {course.price > 0 && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                     bg-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wide shadow-lg">
                      <IndianRupee size={11} />{formatINR(course.price)}
                    </span>
                  )}
                  {course.price <= 0 && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                     bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold tracking-wide shadow-lg">
                      <Sparkles size={11} /> FREE
                    </span>
                  )}
                </div>

                {/* ── Content ── */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <Badge>{course.category}</Badge>
                    <Badge variant="primary">{course.difficulty}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
                    <Users size={13} />
                    <span>{course.learners?.length || 0} learners</span>
                    {course.educator && (
                      <span className="ml-1.5 text-gray-300 dark:text-gray-600">•</span>
                    )}
                    {course.educator && (
                      <span className="truncate max-w-[120px]">by {course.educator.name}</span>
                    )}
                  </div>

                  {/* ── Pricing & Coupon Section (paid + not enrolled) ── */}
                  {course.price > 0 && !enrolled && (
                    <div className="mb-4 rounded-xl border border-gray-200/80 dark:border-gray-700/50
                                    bg-gray-50/80 dark:bg-gray-900/40 p-3 sm:p-3.5 space-y-2 text-xs">

                      {/* Inline coupon message */}
                      {couponMsg && (
                        <div
                          className={`animate-scale-in flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-medium leading-snug ${
                            couponMsg.type === 'success'
                              ? 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : couponMsg.type === 'error'
                                ? 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                : 'bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                          }`}
                        >
                          {couponMsg.type === 'success'
                            ? <CheckCircle size={13} className="mt-px flex-shrink-0" />
                            : <AlertCircle size={13} className="mt-px flex-shrink-0" />}
                          <span>{couponMsg.text}</span>
                        </div>
                      )}

                      {/* Coupon input / Applied tag */}
                      {!appliedCoupon ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <TicketPercent size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <input
                              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium tracking-wide uppercase
                                         bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
                                         text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500
                                         focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500 outline-none
                                         transition-all duration-200"
                              placeholder="Coupon code"
                              value={couponInputMap[course._id] || ''}
                              onChange={(e) =>
                                setCouponInputMap((prev) => ({ ...prev, [course._id]: e.target.value.toUpperCase() }))
                              }
                              onKeyDown={(e) => e.key === 'Enter' && applyCouponPreview(course._id)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => applyCouponPreview(course._id)}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold
                                       bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                                       text-white shadow-sm hover:shadow-md hover:shadow-primary-500/20
                                       transition-all duration-200 whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div className="animate-scale-in flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                                        bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20
                                        border border-emerald-200/80 dark:border-emerald-700/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 dark:bg-emerald-400/15">
                              <Tag size={12} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
                                {appliedCoupon.code}
                              </span>
                              <span className="ml-1.5 text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                                {appliedCoupon.discountType === 'percent'
                                  ? `${appliedCoupon.discountValue}% off`
                                  : `₹${appliedCoupon.discountValue} off`}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCoupon(course._id)}
                            className="flex-shrink-0 p-1 rounded-full text-emerald-500 dark:text-emerald-400
                                       hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400
                                       transition-all duration-200"
                            title="Remove coupon"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Fee breakdown */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                          <span>Course price</span>
                          <span className="inline-flex items-center gap-0.5 font-medium text-gray-700 dark:text-gray-300">
                            <IndianRupee size={10} />{formatINR(course.price)}
                          </span>
                        </div>

                        {!!fees?.discount && appliedCoupon && (
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Discount</span>
                            <span>−₹{formatINR(fees.discount)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-500">
                          <span>Platform fee (2%)</span>
                          <span>{formatINR(fees?.platformFee ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-500">
                          <span>GST (18%)</span>
                          <span>{formatINR(fees?.gst ?? 0)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200 dark:border-gray-700/60
                                        font-bold text-gray-900 dark:text-white">
                          <span>Total</span>
                          <span className="inline-flex items-center gap-0.5 text-sm">
                            <IndianRupee size={12} />{formatINR(getEffectiveTotal(course._id, course.price))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── CTA Button ── */}
                  <div className="mt-auto">
                    {enrolled ? (
                      <Link
                        to={'/learner/courses/' + course._id}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                                   bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700
                                   text-white shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25
                                   transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <BookOpen size={16} /> Continue Learning
                      </Link>
                    ) : course.price > 0 ? (
                      <button
                        onClick={() => payForCourse(course)}
                        disabled={paying === course._id}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                                   bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700
                                   text-white shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                   transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <CreditCard size={16} />
                        {paying === course._id
                          ? 'Processing…'
                          : `Pay & Enroll — ₹${formatINR(getEffectiveTotal(course._id, course.price))}`}
                      </button>
                    ) : (
                      <button
                        onClick={() => enroll(course._id)}
                        disabled={enrolling === course._id}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                                   bg-emerald-600 hover:bg-emerald-700 text-white
                                   shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <Sparkles size={16} />
                        {enrolling === course._id ? 'Enrolling…' : 'Enroll Free'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}