import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { Search, BookOpen, Users, IndianRupee, CreditCard } from 'lucide-react';

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
  const [couponMap, setCouponMap] = useState({});
  usePageTitle('Courses');

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

  const payForCourse = async (course) => {
    setMessage('');
    setPaying(course._id);
    try {
      const scriptReady = !!window.Razorpay;
      if (!scriptReady) throw new Error('Razorpay checkout script not loaded');

      const orderRes = await api.post('/payments/create-order', {
        courseId: course._id,
        couponCode: couponMap[course._id] || '',
      });
      const orderData = orderRes.data;

      if (orderData.directEnrolled) {
        await refreshUser();
        const refreshed = await api.get('/courses');
        setCourses(refreshed.data || []);
        setMessage('Coupon applied. You have been enrolled with zero payment.');
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
            setMessage('Payment successful. You are now enrolled in the course.');
          } catch (verifyErr) {
            setMessage(verifyErr.response?.data?.message || 'Payment verification failed.');
          } finally {
            setPaying(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(null);
            setMessage('Payment cancelled.');
          },
        },
      };

      const rz = new window.Razorpay(options);
      rz.on('payment.failed', (resp) => {
        setMessage(resp?.error?.description || 'Payment failed. Please try again.');
        setPaying(null);
      });
      rz.open();
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || 'Could not initiate payment.');
      setPaying(null);
    }
  };

  const applyCouponPreview = async (courseId) => {
    const code = (couponMap[courseId] || '').trim();
    if (!code) {
      setMessage('Please enter a coupon code first.');
      return;
    }
    try {
      const res = await api.get(`/payments/coupons/validate?courseId=${courseId}&code=${encodeURIComponent(code)}`);
      const breakdown = res.data?.breakdown;
      if (breakdown) {
        setFeeMap((prev) => ({ ...prev, [courseId]: breakdown }));
      }
      setMessage(`Coupon applied: ${res.data?.coupon?.code}`);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Invalid coupon.');
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (api.loading && courses.length === 0) return <Loading />;

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
        <div className="card !p-3 text-sm">
          {message}
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

                {course.price > 0 && (
                  <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-xs space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="input-field !py-2 !text-xs"
                        placeholder="Have a coupon? Enter code"
                        value={couponMap[course._id] || ''}
                        onChange={(e) =>
                          setCouponMap((prev) => ({ ...prev, [course._id]: e.target.value.toUpperCase() }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => applyCouponPreview(course._id)}
                        className="btn-secondary !py-2 !px-3 !text-xs"
                      >
                        Apply
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Course price</span>
                      <span className="inline-flex items-center gap-1"><IndianRupee size={12} />{formatINR(feeMap[course._id]?.coursePrice ?? course.price)}</span>
                    </div>
                    {!!feeMap[course._id]?.discount && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Coupon discount</span>
                        <span>-{formatINR(feeMap[course._id]?.discount ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Platform fee (2%)</span>
                      <span>{formatINR(feeMap[course._id]?.platformFee ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>GST on fee (18%)</span>
                      <span>{formatINR(feeMap[course._id]?.gst ?? 0)}</span>
                    </div>
                    <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100">
                      <span>Total payable</span>
                      <span>{formatINR(feeMap[course._id]?.totalAmount ?? course.price)}</span>
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
                      {paying === course._id ? 'Processing...' : `Pay & Enroll (Rs ${formatINR(feeMap[course._id]?.totalAmount ?? course.price)})`}
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