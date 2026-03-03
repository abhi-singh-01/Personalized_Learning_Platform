import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Brain, Calendar, Clock, Target, Lightbulb } from 'lucide-react';

export default function StudyPlan() {
  const { user } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    goal: '',
    hoursPerWeek: 10,
    weeks: 4,
    courseId: '',
  });

  useEffect(() => {
    api.get('/courses').then((res) => {
      const enrolled = (res.data || []).filter((c) =>
        c.students?.some((s) => {
          const sid = typeof s === 'string' ? s : s._id;
          return sid === (user?.id || user?._id);
        })
      );
      setCourses(enrolled);
    });
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setPlan(null);
    try {
      const res = await api.post('/ai/study-plan', form);
      setPlan(res.data);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="text-primary-600" /> AI Study Plan Generator
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Get a personalized study plan based on your level and goals
        </p>
      </div>

      <Card>
        <form onSubmit={generate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Learning Goal</label>
            <input
              className="input-field"
              placeholder="e.g., Master React hooks and state management"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              required
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Hours per Week</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={40}
                value={form.hoursPerWeek}
                onChange={(e) => setForm({ ...form, hoursPerWeek: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Weeks</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={52}
                value={form.weeks}
                onChange={(e) => setForm({ ...form, weeks: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Course (Optional)</label>
              <select
                className="input-field"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">General</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={generating} className="btn-primary">
            {generating ? 'Generating with AI...' : 'Generate Study Plan'}
          </button>
        </form>
      </Card>

      {generating && <Loading text="AI is creating your personalized plan..." />}

      {plan && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold mb-2">{plan.planTitle}</h2>
            <div className="flex gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1"><Calendar size={16} /> {plan.totalWeeks} weeks</span>
            </div>
            {plan.expectedOutcome && (
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <strong>Expected Outcome:</strong> {plan.expectedOutcome}
              </p>
            )}
          </Card>

          {plan.weeklyPlan?.map((week) => (
            <Card key={week.week}>
              <h3 className="font-semibold text-lg mb-1">
                Week {week.week}: {week.theme}
              </h3>
              {week.goals && (
                <div className="mb-3">
                  {week.goals.map((g, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {week.days?.map((day, di) => (
                  <div key={di} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-600 bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">
                        {day.day}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{day.duration}</span>
                        {day.focus && (
                          <span className="text-xs text-gray-400">| Focus: {day.focus}</span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {day.tasks?.map((task, ti) => (
                          <li key={ti} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
                            <span className="text-primary-500 mt-1">•</span> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {plan.tips && plan.tips.length > 0 && (
            <Card>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-500" /> Tips
              </h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">💡</span> {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}