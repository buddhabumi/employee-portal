const { createRoot } = ReactDOM;
const { useState, useEffect, useRef } = React;
const { BrowserRouter, Routes, Route, Link, useNavigate, Outlet } = ReactRouterDOM;
const supabaseUrl = 'https://aoxwtvxavuddykkmlela.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFveHd0dnhhdnVkZHlra21sZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTY0OTgsImV4cCI6MjA2MjA3MjQ5OH0.SXng4P6mo36mMOG1lwoTXjZ4e-p9kfNwzTnqlU2uFUo';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Navbar Component
function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.user_metadata?.is_admin === true);
      setUserEmail(user?.email || '');
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/profile" className="hover:text-gray-300">My Profile</Link>
          {isAdmin && (
            <>
              <Link to="/admin/employees" className="hover:text-gray-300">Employees</Link>
              <Link to="/admin/attendance" className="hover:text-gray-300">Attendance</Link>
              <Link to="/admin/salaries" className="hover:text-gray-300">Salaries</Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{userEmail}</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// ProtectedRoute Component
function ProtectedRoute({ adminOnly = false }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/login');
        return;
      }
      if (adminOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        const isAdmin = user?.user_metadata?.is_admin === true;
        setIsAuthorized(isAdmin);
        if (!isAdmin) navigate('/');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [navigate, adminOnly]);

  if (isAuthorized === null) return <div>Loading...</div>;
  if (!isAuthorized) return null;
  return <Outlet />;
}

// Login Component
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) setError(authError.message);
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Employee Portal Login</h2>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
            <input id="email" type="email" className="w-full p-2 border border-gray-300 rounded"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input id="password" type="password" className="w-full p-2 border border-gray-300 rounded"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EmployeeDetails />
        <AttendanceChart />
      </div>
      <SalaryHistory />
    </div>
  );
}

// EmployeeDetails Component
function EmployeeDetails({ employeeId }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      const idToFetch = employeeId || (await supabase.auth.getUser()).data.user?.id;
      if (!idToFetch) return;
      const { data, error } = await supabase.from('employee_details').select('*').eq('id', idToFetch).single();
      if (error) console.error('Error fetching employee:', error);
      else setEmployee(data);
      setLoading(false);
    };
    fetchEmployee();
  }, [employeeId]);

  if (loading) return <div>Loading employee details...</div>;
  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Employee Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><p className="font-semibold">Name:</p><p>{employee.name}</p></div>
        <div><p className="font-semibold">Email:</p><p>{employee.email}</p></div>
        <div><p className="font-semibold">Position:</p><p>{employee.position}</p></div>
        <div><p className="font-semibold">Department:</p><p>{employee.department}</p></div>
        <div><p className="font-semibold">Hire Date:</p><p>{new Date(employee.hire_date).toLocaleDateString()}</p></div>
        <div><p className="font-semibold">Salary:</p><p>{employee.currency} {employee.current_salary?.toLocaleString()} ({employee.payment_frequency})</p></div>
      </div>
    </div>
  );
}

// AttendanceChart Component
function AttendanceChart({ employeeId }) {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, late: 0, half_day: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      const idToFetch = employeeId || (await supabase.auth.getUser()).data.user?.id;
      if (!idToFetch) return;
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('employee_id', idToFetch)
        .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());
      if (error) console.error('Error fetching attendance:', error);
      else {
        const counts = {
          present: data.filter((item) => item.status === 'present').length,
          absent: data.filter((item) => item.status === 'absent').length,
          late: data.filter((item) => item.status === 'late').length,
          half_day: data.filter((item) => item.status === 'half-day').length,
        };
        setAttendanceData(counts);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [employeeId]);

  useEffect(() => {
    if (!chartRef.current || loading) return;
    if (chartInstance) chartInstance.destroy();
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    const newChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent', 'Late', 'Half Day'],
        datasets: [{
          data: [attendanceData.present, attendanceData.absent, attendanceData.late, attendanceData.half_day],
          backgroundColor: ['#4CAF50', '#F44336', '#FFC107', '#2196F3'],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Attendance Last 30 Days' },
        },
      },
    });
    setChartInstance(newChartInstance);
    return () => newChartInstance?.destroy();
  }, [attendanceData, loading]);

  if (loading) return <div>Loading attendance data...</div>;
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <canvas ref={chartRef} />
    </div>
  );
}

// SalaryHistory Component
function SalaryHistory({ employeeId }) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaries = async () => {
      const idToFetch = employeeId || (await supabase.auth.getUser()).data.user?.id;
      if (!idToFetch) return;
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('employee_id', idToFetch)
        .order('effective_date', { ascending: false });
      if (error) console.error('Error fetching salaries:', error);
      else setSalaries(data);
      setLoading(false);
    };
    fetchSalaries();
  }, [employeeId]);

  if (loading) return <div>Loading salary history...</div>;
  if (salaries.length === 0) return <div>No salary history found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Salary History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salaries.map((salary) => (
              <tr key={salary.id}>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(salary.effective_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{salary.currency} {salary.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{salary.payment_frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Profile Component
function Profile() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="mb-6"><EmployeeDetails /></div>
      <AttendanceList />
    </div>
  );
}

// Employees Component
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('id, name, email, position, department');
      if (error) console.error('Error fetching employees:', error);
      else setEmployees(data);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  if (loading) return <div>Loading employees...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Manage Employees</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Employee List</h2>
            <div className="space-y-2">
              {employees.map((employee) => (
                <div key={employee.id} className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedEmployee === employee.id ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedEmployee(employee.id)}>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div>
              <EmployeeDetails employeeId={selectedEmployee} />
              <div className="mt-6"><AttendanceList employeeId={selectedEmployee} /></div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500">Select an employee to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AttendanceList Component
function AttendanceList({ employeeId }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const fetchAttendance = async () => {
      const idToFetch = employeeId || (await supabase.auth.getUser()).data.user?.id;
      if (!idToFetch) return;
      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', idToFetch)
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: false });
      if (error) console.error('Error fetching attendance:', error);
      else setAttendance(data);
      setLoading(false);
    };
    fetchAttendance();
  }, [employeeId, monthOffset]);

  const statusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading attendance records...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Attendance Records</h2>
        <div className="flex space-x-2">
          <button onClick={() => setMonthOffset(prev => Math.min(prev + 1, 12))} disabled={monthOffset >= 12}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">&lt;</button>
          <span className="px-2">
            {new Date(new Date().setMonth(new Date().getMonth() - monthOffset)).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setMonthOffset(prev => Math.max(prev - 1, 0))} disabled={monthOffset <= 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">&gt;</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No attendance records found</td></tr>
            ) : (
              attendance.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.check_in || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.check_out || '-'}</td>
                  <td className="px-6 py-4">{record.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ManageAttendance Component
function ManageAttendance() {
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('present');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees').select('id').eq('email', employeeEmail).single();
    if (employeeError || !employeeData) {
      setMessage({ text: 'Employee not found', type: 'error' });
      return;
    }
    const { error } = await supabase.from('attendance').upsert({
      employee_id: employeeData.id, date, status,
      check_in: checkIn || null, check_out: checkOut || null, notes: notes || null,
    });
    if (error) setMessage({ text: `Error: ${error.message}`, type: 'error' });
    else {
      setMessage({ text: 'Attendance record saved successfully', type: 'success' });
      setDate(''); setCheckIn(''); setCheckOut(''); setNotes('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Manage Attendance</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add Attendance Record</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="employeeEmail">Employee Email</label>
              <input id="employeeEmail" type="email" className="w-full p-2 border border-gray-300 rounded"
                value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="date">Date</label>
              <input id="date" type="date" className="w-full p-2 border border-gray-300 rounded"
                value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="status">Status</label>
              <select id="status" className="w-full p-2 border border-gray-300 rounded"
                value={status} onChange={(e) => setStatus(e.target.value)} required>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="checkIn">Check In (optional)</label>
                <input id="checkIn" type="time" className="w-full p-2 border border-gray-300 rounded"
                  value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="checkOut">Check Out (optional)</label>
                <input id="checkOut" type="time" className="w-full p-2 border border-gray-300 rounded"
                  value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="notes">Notes (optional)</label>
              <textarea id="notes" className="w-full p-2 border border-gray-300 rounded" rows={3}
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save Attendance
            </button>
            {message && (
              <div className={`mt-4 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>
        <div><AttendanceList /></div>
      </div>
    </div>
  );
}

// ManageSalaries Component
function ManageSalaries() {
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [frequency, setFrequency] = useState('monthly');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees').select('id').eq('email', employeeEmail).single();
    if (employeeError || !employeeData) {
      setMessage({ text: 'Employee not found', type: 'error' });
      return;
    }
    const { error } = await supabase.from('salaries').insert({
      employee_id: employeeData.id,
      amount: parseFloat(amount),
      currency,
      payment_frequency: frequency,
      effective_date: effectiveDate,
    });
    if (error) setMessage({ text: `Error: ${error.message}`, type: 'error' });
    else {
      setMessage({ text: 'Salary record saved successfully', type: 'success' });
      setEmployeeEmail(''); setAmount(''); setEffectiveDate('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Manage Salaries</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Add Salary Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="employeeEmail">Employee Email</label>
            <input id="employeeEmail" type="email" className="w-full p-2 border border-gray-300 rounded"
              value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="amount">Amount</label>
              <input id="amount" type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded"
                value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="currency">Currency</label>
              <select id="currency" className="w-full p-2 border border-gray-300 rounded"
                value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="effectiveDate">Effective Date</label>
              <input id="effectiveDate" type="date" className="w-full p-2 border border-gray-300 rounded"
                value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="frequency">Payment Frequency</label>
              <select id="frequency" className="w-full p-2 border border-gray-300 rounded"
                value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save Salary
          </button>
          {message && (
            <div className={`mt-4 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// NotFound Component
function NotFound() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go back to home</Link>
    </div>
  );
}

// App Component
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin/employees" element={<Employees />} />
          <Route path="/admin/attendance" element={<ManageAttendance />} />
          <Route path="/admin/salaries" element={<ManageSalaries />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Render the app
const root = createRoot(document.getElementById('root'));
root.render(<App />);
