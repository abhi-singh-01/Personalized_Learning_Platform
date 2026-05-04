import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { Search, BookOpen, Users, IndianRupee, CreditCard, Tag, X, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [messageType, setMessageType] = useState('info');        // 'success' | 'error' | 'info'
  const [couponInputMap, setCouponInputMap] = useState({});       // text input per course
  const [appliedCouponMap, setAppliedCouponMap] = useState({});   // applied coupon info per course
  const [originalFeeMap, setOriginalFeeMap] = useState({});       // fees without coupon (for restore on remove)
  usePageTitle('Courses');

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

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

  /* ─── Apply coupon preview ─── */
  const applyCouponPreview = async (courseId) => {
    // Prevent applying multiple coupons — one per purchase
    if (appliedCouponMap[courseId]) {
      showMessage('Only one coupon can be applied per purchase. Remove the current coupon first.', 'error');
      return;
    }

    const code = (couponInputMap[courseId] || '').trim();
    if (!code) {
      showMessage('Please enter a coupon code first.', 'error');
      return;
    }
    try {
      const res = await api.get(`/payments/coupons/validate?courseId=${courseId}&code=${encodeURIComponent(code)}`);
      const breakdown = res.data?.breakdown;
      const couponInfo = res.data?.coupon;

      if (breakdown) {
        // Store original fees for restoring when coupon is removed
        if (!originalFeeMap[courseId]) {
          setOriginalFeeMap((prev) => ({ ...prev, [courseId]: feeMap[courseId] }));
        }
        setFeeMap((prev) => ({ ...prev, [courseId]: breakdown }));
      }

      // Mark coupon as applied
      setAppliedCouponMap((prev) => ({
        ...prev,
        [courseId]: {
          code: couponInfo?.code || code.toUpperCase(),
          discountType: couponInfo?.discountType,
          discountValue: couponInfo?.discountValue,
          discount: breakdown?.discount || 0,
        },
      }));

      showMessage(`Coupon "${couponInfo?.code || code}" applied successfully!`, 'success');
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Invalid or expired coupon.';
      showMessage(errMsg, 'error');
    }
  };

  /* ─── Remove applied coupon ─── */
  const removeCoupon = (courseId) => {
    // Restore original fees
    if (originalFeeMap[courseId]) {
      setFeeMap((prev) => ({ ...prev, [courseId]: originalFeeMap[courseId] }));
    }
    setAppliedCouponMap((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    setCouponInputMap((prev) => ({ ...prev, [courseId]: '' }));
    showMessage('Coupon removed.', 'info');
  };

  /* ─── Pay for course ─── */
  const payForCourse = async (course) => {
    setMessage('');
    setPaying(course._id);
    try {
      const scriptReady = !!window.Razorpay;
      if (!scriptReady) throw new Error('Razorpay checkout script not loaded');

      const appliedCoupon = appliedCouponMap[course._id];
      const orderRes = await api.post('/payments/create-order', {
        courseId: course._id,
        couponCode: appliedCoupon?.code || '',
      });
      const orderData = orderRes.data;

      if (orderData.directEnrolled) {
        await refreshUser();
        const refreshed = await api.get('/courses');
        setCourses(refreshed.data || []);
        showMessage('Coupon applied. You have been enrolled with zero payment!', 'success');
        // Clear coupon state for this course
        setAppliedCouponMap((prev) => { const n = { ...prev }; delete n[course._id]; return n; });
        setCouponInputMap((prev) => ({ ...prev, [course._id]: '' }));
        setPaying(null);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: Math.round(Number(orderData.amount || 0) * 100),
        currency: orderData.currency || 'INR',
        name: 'Personalized Learning Platform',
        description: `Purchase: ${orderData.courseName || course.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#2563EB',
        },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await refreshUser();
            const refreshed = await api.get('/courses');
            setCourses(refreshed.data || []);
            showMessage('Payment successful! You are now enrolled in the course.', 'success');
            // Clear coupon state
            setAppliedCouponMap((prev) => { const n = { ...prev }; delete n[course._id]; return n; });
            setCouponInputMap((prev) => ({ ...prev, [course._id]: '' }));
          } catch (verifyErr) {
            showMessage(verifyErr.response?.data?.message || 'Payment verification failed.', 'error');
          } finally {
            setPaying(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(null);
            showMessage('Payment cancelled.', 'info');
          },
        },
      };

      const rz = new window.Razorpay(options);
      rz.on('payment.failed', (resp) => {
        showMessage(resp?.error?.description || 'Payment failed. Please try again.', 'error');
        setPaying(null);
      });
      rz.open();
    } catch (e) {
      showMessage(e.response?.data?.message || e.message || 'Could not initiate payment.', 'error');
      setPaying(null);
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (api.loading && courses.length === 0) return <Loading />;

  /* ─── Helper to get the effective total for a course ─── */
  const getEffectiveTotal = (courseId, originalPrice) => {
    const fees = feeMap[courseId];
    if (!fees) return originalPrice;
    const discount = fees.discount || 0;
    return Math.max(0, fees.totalAmount);
  };

  /* ─── Message banner styles ─── */
  const messageBannerClass =
    messageType === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
      : messageType === 'error'
        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';

  const MessageIcon = messageType === 'success' ? CheckCircle : messageType === 'error' ? AlertCircle : AlertCircle;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Courses</h1>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input-field pl-10 w-64"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${messageBannerClass}`}>
          <MessageIcon size={16} className="flex-shrink-0" />
          <span className="flex-1">{message}</span>
          <button onClick={() => setMessage('')} className="ml-auto hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No courses found" icon={BookOpen} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const userId = user?.id || user?._id;
            const enrolled = course.learners?.some((s) => {
              const sid = typeof s === 'string' ? s : s._id;
              return sid === userId;
            });
            const appliedCoupon = appliedCouponMap[course._id];
            const fees = feeMap[course._id];

            return (
              <div key={course._id} className="card flex flex-col">
                <div className="h-32 rounded-lg bg-gradient-to-br from-primary-400 to-violet-500 mb-4 flex items-center justify-center">
                  <BookOpen size={40} className="text-white/80" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge>{course.category}</Badge>
                  <Badge variant="primary">{course.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <Users size={14} /> {course.learners?.length || 0} learners
                  {course.educator && (
                    <span className="ml-2">by {course.educator.name}</span>
                  )}
                </div>

                {course.price > 0 && !enrolled && (
                  <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-xs space-y-1">

                    {/* ── Coupon Input / Applied Tag ── */}
                    {!appliedCoupon ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          className="input-field !py-2 !text-xs flex-1"
                          placeholder="Have a coupon? Enter code"
                          value={couponInputMap[course._id] || ''}
                          onChange={(e) =>
                            setCouponInputMap((prev) => ({ ...prev, [course._id]: e.target.value.toUpperCase() }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && applyCouponPreview(course._id)}
                        />
                        <button
                          type="button"
                          onClick={() => applyCouponPreview(course._id)}
                          className="btn-secondary !py-2 !px-3 !text-xs"
                        >
                          Apply
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2 px-2 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <Tag size={12} />
                          <span className="font-semibold">{appliedCoupon.code}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ({appliedCoupon.discountType === 'percent'
                              ? `${appliedCoupon.discountValue}% off`
                              : `₹${appliedCoupon.discountValue} off`})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCoupon(course._id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5"
                          title="Remove coupon"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* ── Fee Breakdown ── */}
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Course price</span>
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee size={12} />{formatINR(course.price)}
                      </span>
                    </div>

                    {!!fees?.discount && appliedCoupon && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Coupon discount</span>
                        <span>-{formatINR(fees.discount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-gray-500">
                      <span>Platform fee (2%)</span>
                      <span>{formatINR(fees?.platformFee ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>GST on fee (18%)</span>
                      <span>{formatINR(fees?.gst ?? 0)}</span>
                    </div>
                    <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100">
                      <span>Total payable</span>
                      <span>{formatINR(getEffectiveTotal(course._id, course.price))}</span>
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  {enrolled ? (
                    <Link
                      to={'/learner/courses/' + course._id}
                      className="btn-primary w-full text-center block text-sm"
                    >
                      Continue Learning
                    </Link>
                  ) : course.price > 0 ? (
                    <button
                      onClick={() => payForCourse(course)}
                      disabled={paying === course._id}
                      className="btn-primary w-full text-sm inline-flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} />
                      {paying === course._id
                        ? 'Processing...'
                        : `Pay & Enroll (₹${formatINR(getEffectiveTotal(course._id, course.price))})`}
                    </button>
                  ) : (
                    <button
                      onClick={() => enroll(course._id)}
                      disabled={enrolling === course._id}
                      className="btn-secondary w-full text-sm"
                    >
                      {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}