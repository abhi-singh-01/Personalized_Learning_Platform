import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import BDUIPanel from '../../components/ui/BDUIPanel';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { resolveMaterialUrl } from '../../utils/materialUrl';
import {
  Search, BookOpen, Users, IndianRupee, CreditCard,
  Tag, X, CheckCircle, AlertCircle, Sparkles, TicketPercent,
  QrCode, Smartphone, Shield, Loader2, Zap,
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
  const lastRazorpayOrderRef = useRef(null);
  const [checkoutOptions, setCheckoutOptions] = useState({ razorpay: false, dummy: false });
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

  // Backend: DUMMY_PAYMENT=true + RAZORPAY_* → both buttons. See backend/.env.example.
  useEffect(() => {
    if (user?.role !== 'learner') return;
    api.get('/payments/checkout-options').then((res) => {
      const o = res.data || {};
      setCheckoutOptions({
        razorpay: Boolean(o.razorpay),
        dummy: Boolean(o.dummy),
      });
    }).catch(() => setCheckoutOptions({ razorpay: false, dummy: false }));
  }, [user?.role]);

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

  /* ─── Dummy Payment Modal State ─── */
  const [dummyModal, setDummyModal] = useState(null); // { stage, orderData, course }
  const [dummyPayMethod, setDummyPayMethod] = useState('card');

  const payForCourse = async (course, paymentMode = 'razorpay') => {
    setMessage('');
    setPaying(course._id);
    try {
      const appliedCoupon = appliedCouponMap[course._id];
      const orderRes = await api.post('/payments/create-order', {
        courseId: course._id,
        couponCode: appliedCoupon?.code || '',
        paymentMode: paymentMode === 'dummy' ? 'dummy' : 'razorpay',
      });
      const orderData = orderRes.data;

      // Zero-payment coupon path
      if (orderData.directEnrolled) {
        await refreshUser();
        setCourses((await api.get('/courses')).data || []);
        showMessage('Coupon applied — enrolled with zero payment!', 'success');
        setAppliedCouponMap((p) => { const n = { ...p }; delete n[course._id]; return n; });
        setCouponInputMap((p) => ({ ...p, [course._id]: '' }));
        setPaying(null);
        return;
      }

      // ── DUMMY PAYMENT MODE ──
      if (orderData.dummyMode) {
        setDummyModal({ stage: 'checkout', orderData, course });
        setPaying(null);
        return;
      }

      // ── REAL RAZORPAY CHECKOUT ──
      if (!window.Razorpay) throw new Error('Razorpay checkout script not loaded');
      lastRazorpayOrderRef.current = orderData.orderId;
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
      rz.on('payment.failed', async (r) => {
        const err = r?.error || {};
        try {
          await api.post('/payments/report-failure', {
            razorpayOrderId: lastRazorpayOrderRef.current,
            error: {
              code: err.code,
              description: err.description || err.message || 'Payment failed',
              reason: err.reason,
              source: 'razorpay_checkout',
              metadata: err.metadata,
              payment_id: err.metadata?.payment_id,
            },
          });
        } catch {
          /* still show user-facing message */
        }
        showMessage(err.description || err.message || 'Payment failed.', 'error');
        setPaying(null);
      });
      setPaying(null);
      rz.open();
    } catch (e) {
      const base = e.response?.data?.message || e.message || 'Could not initiate payment.';
      const netHint =
        import.meta.env.PROD && !e.response
          ? ' If this persists, set VITE_API_URL on Vercel to your Render API (…/api) and FRONTEND_URL on Render to your Vercel URL (see README).'
          : '';
      showMessage(base + netHint, 'error');
      setPaying(null);
    }
  };

  const handleDummyPay = async () => {
    if (!dummyModal) return;
    setDummyModal((prev) => ({ ...prev, stage: 'processing' }));
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 2200));
    try {
      await api.post('/payments/dummy-verify', { orderId: dummyModal.orderData.orderId });
      setDummyModal((prev) => ({ ...prev, stage: 'success' }));
      await refreshUser();
      setCourses((await api.get('/courses')).data || []);
      setAppliedCouponMap((p) => { const n = { ...p }; delete n[dummyModal.course._id]; return n; });
      setCouponInputMap((p) => ({ ...p, [dummyModal.course._id]: '' }));
    } catch (err) {
      setDummyModal(null);
      showMessage(err.response?.data?.message || 'Dummy payment failed.', 'error');
    }
  };

  const closeDummyModal = () => {
    if (dummyModal?.stage === 'success') {
      showMessage('Payment successful! You are now enrolled.', 'success');
    }
    setDummyModal(null);
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
      <BDUIPanel screen="courses" />
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
                  {course.thumbnail ? (
                    <img
                      src={resolveMaterialUrl(course.thumbnail)}
                      alt={course.title}
                      className="absolute inset-0 h-full w-full object-contain bg-white dark:bg-gray-900 p-3"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
                      <BookOpen size={36} className="text-white/70 group-hover:scale-110 transition-transform duration-300" />
                    </>
                  )}
                  {!course.thumbnail && <div className="absolute inset-0 bg-black/10" />}
                  {course.price > 0 && (
                    <span
                      className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide shadow-lg ${
                        course.thumbnail
                          ? 'bg-emerald-600 text-white ring-2 ring-white dark:ring-gray-900'
                          : 'bg-white/20 backdrop-blur-md text-white'
                      }`}
                    >
                      <IndianRupee size={11} />{formatINR(course.price)}
                    </span>
                  )}
                  {course.price <= 0 && (
                    <span
                      className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg ${
                        course.thumbnail
                          ? 'bg-emerald-600 text-white ring-2 ring-white dark:ring-gray-900'
                          : 'bg-emerald-500/90 backdrop-blur-md text-white'
                      }`}
                    >
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
                      <div className="flex flex-col gap-2">
                        {checkoutOptions.razorpay && (
                          <button
                            type="button"
                            onClick={() => payForCourse(course, 'razorpay')}
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
                              : `Pay with Razorpay — ₹${formatINR(getEffectiveTotal(course._id, course.price))}`}
                          </button>
                        )}
                        {checkoutOptions.dummy && (
                          <button
                            type="button"
                            onClick={() => payForCourse(course, 'dummy')}
                            disabled={paying === course._id}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                                       border-2 border-dashed border-amber-400/80 dark:border-amber-500/50
                                       bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200
                                       hover:bg-amber-100/90 dark:hover:bg-amber-900/40
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all duration-300"
                          >
                            <Zap size={16} />
                            {paying === course._id
                              ? 'Processing…'
                              : `Test pay (mock) — ₹${formatINR(getEffectiveTotal(course._id, course.price))}`}
                          </button>
                        )}
                        {!checkoutOptions.razorpay && !checkoutOptions.dummy && (
                          <p className="text-xs text-center text-red-600 dark:text-red-400 py-2">
                            Payments are not configured. Ask your administrator to set Razorpay keys and/or enable test checkout.
                          </p>
                        )}
                      </div>
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
      {/* ── Dummy Razorpay Payment Modal ── */}
      {dummyModal && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget && dummyModal.stage !== 'processing') closeDummyModal(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-md my-4 sm:my-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in max-h-[92vh] overflow-y-auto"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >

            {/* ── STAGE: Checkout ── */}
            {dummyModal.stage === 'checkout' && (
              <>
                {/* Razorpay-style header */}
                <div className="bg-gradient-to-r from-[#072654] to-[#0b3d91] px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M22 9.74L14.81 12.48L22 4H18.19L11 11.61L13.41 3.3H9.8L2 22H5.8L10.29 13.73L7.89 22H11.5L18.19 14.39L15.78 22H19.59L22 9.74Z" fill="white"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Personalized Learning Platform</p>
                        <p className="text-blue-200 text-xs">Order #{dummyModal.orderData.orderId?.slice(-8)}</p>
                      </div>
                    </div>
                    <button onClick={closeDummyModal} className="text-white/60 hover:text-white p-1 rounded transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold text-white">₹{formatINR(dummyModal.orderData.amount)}</span>
                    <span className="text-blue-200 text-sm ml-1">INR</span>
                  </div>
                  <p className="text-blue-200/80 text-xs mt-1">{dummyModal.orderData.courseName}</p>
                </div>

                {/* Test mode banner */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Test Mode — No real money will be charged</span>
                </div>

                {/* Payment methods */}
                <div className="p-4 sm:p-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-5">
                    {[
                      { key: 'card', label: 'Card', icon: CreditCard },
                      { key: 'upi', label: 'UPI', icon: Smartphone },
                      { key: 'qr', label: 'QR Code', icon: QrCode },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setDummyPayMethod(key)}
                        className={`flex flex-col items-center gap-1.5 px-2 py-2.5 sm:p-3 rounded-xl border-2 text-xs font-medium transition-all duration-200 ${
                          dummyPayMethod === key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/10'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon size={20} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Card details (dummy) */}
                  {dummyPayMethod === 'card' && (
                    <div className="space-y-3 animate-slide-up">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Card Number</label>
                        <div className="relative">
                          <input
                            readOnly
                            value="4111 1111 1111 1111"
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300 cursor-default"
                          />
                          <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Expiry</label>
                          <input readOnly value="12/29" className="w-full px-3 sm:px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300 cursor-default" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">CVV</label>
                          <input readOnly value="•••" className="w-full px-3 sm:px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300 cursor-default" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI (dummy) */}
                  {dummyPayMethod === 'upi' && (
                    <div className="space-y-3 animate-slide-up">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">UPI ID</label>
                        <input readOnly value="testuser@razorpay" className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300 cursor-default" />
                      </div>
                    </div>
                  )}

                  {/* QR Code (dummy) */}
                  {dummyPayMethod === 'qr' && (
                    <div className="flex flex-col items-center gap-3 py-2 animate-slide-up">
                      <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-3 flex items-center justify-center">
                        {/* Simulated QR pattern */}
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <rect x="0" y="0" width="100" height="100" fill="white"/>
                          {/* Corner markers */}
                          <rect x="5" y="5" width="25" height="25" fill="#072654" rx="3"/>
                          <rect x="8" y="8" width="19" height="19" fill="white" rx="2"/>
                          <rect x="11" y="11" width="13" height="13" fill="#072654" rx="1"/>
                          <rect x="70" y="5" width="25" height="25" fill="#072654" rx="3"/>
                          <rect x="73" y="8" width="19" height="19" fill="white" rx="2"/>
                          <rect x="76" y="11" width="13" height="13" fill="#072654" rx="1"/>
                          <rect x="5" y="70" width="25" height="25" fill="#072654" rx="3"/>
                          <rect x="8" y="73" width="19" height="19" fill="white" rx="2"/>
                          <rect x="11" y="76" width="13" height="13" fill="#072654" rx="1"/>
                          {/* Data cells */}
                          {[35,40,45,50,55,60].map(x => [5,15,25,35,45,55,65,75,85].map(y => (
                            Math.random() > 0.4 ? <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="#072654" rx="0.5" /> : null
                          )))
                          }
                          {[5,15,25,65,75,85].map(x => [35,40,45,50,55,60].map(y => (
                            Math.random() > 0.4 ? <rect key={`b${x}-${y}`} x={x} y={y} width="4" height="4" fill="#072654" rx="0.5" /> : null
                          )))
                          }
                          <rect x="70" y="70" width="25" height="25" fill="none" stroke="#072654" strokeWidth="2" rx="3"/>
                          <circle cx="82.5" cy="82.5" r="6" fill="#072654"/>
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Scan with any UPI app to pay</p>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handleDummyPay}
                    className="w-full mt-4 sm:mt-5 py-3 rounded-xl text-sm font-bold text-white
                               bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af]
                               shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                               transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Shield size={16} />
                    Pay ₹{formatINR(dummyModal.orderData.amount)}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
                    <Shield size={12} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">Secured by <span className="font-semibold">Razorpay</span></span>
                  </div>
                </div>
              </>
            )}

            {/* ── STAGE: Processing ── */}
            {dummyModal.stage === 'processing' && (
              <div className="px-6 py-16 flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full" />
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
                  <CreditCard size={22} className="absolute inset-0 m-auto text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">Processing Payment</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we confirm your payment...</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* ── STAGE: Success ── */}
            {dummyModal.stage === 'success' && (
              <div className="px-6 py-12 flex flex-col items-center gap-5">
                {/* Animated success checkmark */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                       style={{ animation: 'scaleIn 0.5s ease-out' }}>
                    <CheckCircle size={40} className="text-white" style={{ animation: 'scaleIn 0.6s ease-out 0.2s both' }} />
                  </div>
                  {/* Celebration rings */}
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-emerald-300/40 animate-ping" />
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Successful!</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You've been enrolled in the course</p>
                </div>

                {/* Payment summary */}
                <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Course</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px] text-right">{dummyModal.orderData.courseName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Amount Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formatINR(dummyModal.orderData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Payment ID</span>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">dummy_pay_***</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle size={13} /> Captured
                    </span>
                  </div>
                </div>

                <button
                  onClick={closeDummyModal}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white
                             bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700
                             shadow-lg shadow-emerald-500/25 transition-all duration-200"
                >
                  Continue to Course →
                </button>

                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Shield size={10} /> Dummy payment — test mode
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}